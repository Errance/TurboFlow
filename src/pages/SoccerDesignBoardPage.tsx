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
  ['v6-overview', 'v6 基线'],
  ['v6-pages', 'v6 页面预览'],
  ['v6-markets', 'v6 市场覆盖'],
  ['v6-states', 'v6 状态与异常'],
  ['v6-compliance', 'v6 结算边界'],
]

const deltaBoardSections = [
  ['coverage', '总览'],
  ['v60-amm-delta', 'v6 → v7 报价交易对比'],
]

const v71BoardSections = [
  ['coverage', '总览'],
  ['v71-series-yesno', 'v7.0 单场 ↔ v7.1 系列赛 YES/NO'],
  ['v71-coverage-matrix', 'v7.1 覆盖矩阵'],
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
  ['MarketRenderer', 'src/components/soccer/MarketRenderer.tsx', '仅用于 Design Board 和旧版对照，不是 v7 正式足球路由主渲染器'],
  ['SoccerBetSlip', 'src/components/soccer/SoccerBetSlip.tsx', '传统投注单历史覆盖，v7 当前主流程为报价交易面板'],
  ['SoccerBetSlipFloat', 'src/components/soccer/SoccerBetSlipFloat.tsx', '传统浮动条作为遗留能力边界标注，不在本版本主交付'],
  ['ConfirmBetDialog', 'src/components/soccer/ConfirmBetDialog.tsx', '传统投注二次确认与最新报价确认语义不同'],
  ['MyBetCard / MyBetsPanel', 'src/components/soccer', '传统注单卡和摘要保留为历史资产，v7 主视图为 Portfolio'],
]

const excludedCoverage = [
  ['SoccerPredictionPage', '未注册路由', '预测 bracket 不属于本期足球主流程'],
  ['SoccerPredictionLeaderboardPage', '未注册路由', '排行榜分享链路不纳入 v7 Design Board 差异区'],
  ['SoccerPredictionShareView', '未注册路由', '分享页不纳入当前足球 tab mock 改造范围'],
  ['CLOB 足球页', '/clob、/clob/match/:matchId', '撮合版本是独立产品线，不在 v7 本期范围内'],
  ['串关 / Cash Out / 传统投注单', '本版本暂不交付', '不得写成永久删除，后续形态需产品确认'],
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

type BoardTab = 'v6' | 'delta' | 'v71'

export default function SoccerDesignBoardPage() {
  const [activeBoardTab, setActiveBoardTab] = useState<BoardTab>('v71')
  const currentBoardSections = activeBoardTab === 'v6'
    ? v6BoardSections
    : activeBoardTab === 'v71'
      ? v71BoardSections
      : deltaBoardSections

  return (
    <div
      className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-10"
    >
      <header id="coverage" className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <p className="text-xs text-[#2DD4BF] font-semibold mb-2">足球预测交易市场设计状态展板</p>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">足球 v7.0 报价交易 Design Board</h1>
        <p className="mt-3 max-w-4xl text-sm text-[var(--text-secondary)] leading-6">
          本页面拆成两个可切换 tab：v6.0 AMM 基线用于保留上一版设计语境；v6.0 → v7.0 报价交易对比只展示交易模型切换后真实需要变化的 UI。
        </p>
        {activeBoardTab === 'v6' ? (
          <div className="mt-4 grid gap-2 md:grid-cols-6">
            <Metric label="变更对比项" value="17" />
            <Metric label="v6 激活项" value={String(v6ActiveCoverage.length)} />
            <Metric label="历史对照项" value={String(legacyCoverage.length)} />
            <Metric label="本期盘口" value="7" />
            <Metric label="赛事级市场" value={String(futureMarketCoverage.length)} />
            <Metric label="待确认边界" value={String(excludedCoverage.length)} />
          </div>
        ) : activeBoardTab === 'v71' ? (
          <div className="mt-4 grid gap-2 md:grid-cols-6">
            <Metric label="v7.1 变更项" value="6/6" />
            <Metric label="页面区域" value="5/5" />
            <Metric label="单场市场" value="7/7 不动" />
            <Metric label="系列赛 mock 演示门槛" value="2/11" />
            <Metric label="系列赛上线门槛" value="11/11" />
            <Metric label="持仓状态机" value="9 态 复用" />
          </div>
        ) : (
          <div className="mt-4 grid gap-2 md:grid-cols-6">
            <Metric label="报价交易变更项" value="17/17" />
            <Metric label="页面区域" value="5/5" />
            <Metric label="单场市场" value="7/7" />
            <Metric label="赛事级市场" value="11/11" />
            <Metric label="状态变化" value="8/8" />
            <Metric label="边界说明" value="5/5" />
          </div>
        )}
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-control)] p-4">
          <p className="text-xs font-semibold text-[var(--text-primary)]">当前默认展示 v7.0 报价交易：保持原市场范围，交易从 AMM 参考价切换为短时有效报价</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {LEAN_MARKET_ORDER.map((title) => (
              <span key={title} className="rounded-full bg-[#2DD4BF]/10 px-2.5 py-1 text-[10px] text-[#2DD4BF]">{title}</span>
            ))}
            {['小组赛', '淘汰赛', '冠军', '晋级', '赛季名次', '两回合系列赛'].map((title) => (
              <span key={title} className="rounded-full bg-[#E85A7E]/10 px-2.5 py-1 text-[10px] text-[#E85A7E]">{title}</span>
            ))}
          </div>
          <p className="mt-3 text-[10px] leading-5 text-[var(--text-secondary)]">
            本页以两个 tab 组织：v6.0 基线用于保留 AMM 语境；v6.0 → v7.0 对比用于核对报价交易改动，且不把串关、Cash Out 等历史能力写成永久删除。
          </p>
        </div>
        <div className="mt-5 grid gap-2 md:grid-cols-3">
          {[
            ['v71', 'v7.0 单场 ↔ v7.1 系列赛 YES/NO', '系列赛/冠军与晋级每个候选新增 YES + NO 两腿；单场 7/7 不动。'],
            ['delta', 'v6.0 → v7.0 报价交易对比', '只展示从 AMM 切到短时有效报价后真实变化的 UI 和产品语义。'],
            ['v6', 'v6.0 AMM 基线', '上一版 AMM 主流程、页面、组件、状态、价格和结算语境。'],
          ].map(([id, label, description]) => (
            <button
              key={id}
              onClick={() => setActiveBoardTab(id as BoardTab)}
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
      ) : activeBoardTab === 'v71' ? (
        <V71SeriesYesNoTab />
      ) : (
        <>
      <BoardSection id="v60-amm-delta" title="v6.0 AMM → v7.0 报价交易 UI 变更对比" description="本区只展示用户能看到的界面变化。每行左侧是 v6 AMM 基线，右侧是 v7 报价交易目标状态，下方只写可见变化点。">
        <div className="rounded-2xl border border-[#2DD4BF]/25 bg-[#2DD4BF]/5 p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <SmallState title="读法" text="从左到右看：v6 AMM 基线 → v7 报价交易目标状态。" />
            <SmallState title="覆盖" text="页面 5/5、单场市场 7/7、赛事级市场 11/11、状态 8/8、边界说明 5/5、全局入口 2/2。" />
            <SmallState title="只看 UI" text="只展示按钮、文案、面板、状态、入口和价格显示等可见变化。" />
          </div>
        </div>

        <div className="space-y-6">
          <ChangeComparisonRow
            index="01"
            title="首页比赛列表价格列"
            scope="SoccerPage / MatchListCard"
            summary="比赛列表仍展示胜平负、大小球、让球列；左侧是 v6.0 AMM 参考价，右侧是 v7.0 短时有效报价展示。"
            before={<OldMarketListPreview />}
            after={<NewAmmMarketListPreview />}
            paths={['src/pages/SoccerPage.tsx', 'src/components/soccer/MatchListCard.tsx']}
            statusTags={['正式路由', '价格展示改动']}
            notes={['保留原来的列位置和市场入口。', '价格格式由小齿轮弹框控制：概率 + 份额价格 / 欧洲赔率。', '列表价格是参考展示，成交以交易面板最新报价为准。']}
          />

          <ChangeComparisonRow
            index="02"
            title="市场卡片和 outcome 按钮"
            scope="MarketRenderer → AmmMarketRenderer"
            summary="v6 点击 outcome 后查看 AMM 预估；v7 仍点击 outcome，但右栏展示买入报价或退出报价。"
            before={<OldOutcomeButtonsPreview />}
            after={<NewAmmOutcomeButtonsPreview />}
            paths={['src/components/soccer/MarketRenderer.tsx', 'src/components/soccer/AmmMarketRenderer.tsx']}
            statusTags={['组件替换', 'outcome 交易']}
            notes={['每个 outcome 展示概率、Buy Yes/No 份额价格、24h Vol. 和 24h 涨跌幅。', '开放、暂停、关闭等状态通过卡片视觉状态表达，不占用指标行。', '欧洲赔率只作为展示换算，成交价由交易面板最新报价锁定。']}
          />

          <ChangeComparisonRow
            index="03"
            title="7 个单场市场全量报价化"
            scope="SoccerMatchPage / sourceMatch.tabs"
            summary="不是只改胜平负示例；当前足球 tab 可见的 7 个单场市场都要沿用 outcome 结构并接入短时有效报价。"
            before={<OldSingleMarketCoveragePreview />}
            after={<NewAmmSingleMarketCoveragePreview />}
            paths={['src/pages/SoccerMatchPage.tsx', 'src/data/soccer/mockData.ts', 'src/data/soccer/ammData.ts']}
            statusTags={['7/7 单场市场', '不新增不删除']}
            notes={['胜平负、开球权、让球、让球 0:1、总进球数、大小球、波胆全部覆盖。', '市场名称和排序不变，只替换交易语义。', '波胆和区间类市场也必须用 outcome、shares、position 和最新报价表达。']}
          />

          <ChangeComparisonRow
            index="04"
            title="比赛详情右栏"
            scope="SoccerBetSlip → AmmTradePanel"
            summary="右栏从 AMM 交易面板调整为报价交易面板。买入获取最新报价，卖出获取退出报价，支持部分卖出和全部卖出。"
            before={<OldBetSlipPanelPreview />}
            after={<NewAmmTradePanelPreview />}
            paths={['src/pages/SoccerMatchPage.tsx', 'src/components/soccer/AmmTradePanel.tsx']}
            statusTags={['买入', '部分卖出', '全部卖出']}
            notes={['买入确认展示份额、成交报价、手续费和最大亏损。', '卖出确认额外展示退出报价、收回金额、已实现盈亏和卖出后剩余份额。', '部分卖出不是部分成交，也不产生挂单。']}
          />

          <ChangeComparisonRow
            index="05"
            title="交易面板状态矩阵"
            scope="AmmTradePanel / soccerAmmStore"
            summary="v7 不重做交易面板结构，但状态从 AMM quote 切换为最新报价、报价过期、报价更新和市场暂停。"
            before={<OldBetSlipStateMatrixPreview />}
            after={<NewAmmTradeStateMatrixPreview />}
            paths={['src/components/soccer/AmmTradePanel.tsx', 'src/stores/soccerAmmStore.ts']}
            statusTags={['quote 生命周期', '风险反馈', '无挂单']}
            notes={['空选择、买入、卖出、部分卖出、全部卖出都要有明确状态。', '余额不足、报价过期、报价更新和市场暂停都以用户提示展示。', '串关、Cash Out 等历史能力仅标注为本版本暂不交付 / 后续待确认。']}
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
            summary="系列赛对象、阶段分组和 11 个市场保持不变；左侧是 v6 AMM 长期 outcome，右侧是 v7 长期报价交易。"
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
            summary="赔率格式设置继续使用小齿轮弹框；异常提示从 AMM liquidity / price impact 调整为报价过期、报价更新和市场暂停。"
            before={<OldSettingsAndErrorPreview />}
            after={<NewPriceAndRiskPreview />}
            paths={['src/components/soccer/SoccerPriceFormatToggle.tsx', 'src/data/soccer/ammData.ts']}
            statusTags={['份额主价格', '欧洲赔率展示', '报价风险态']}
            notes={['交易确认中同时展示概率、份额价格和欧洲赔率换算。', '报价过期、报价变化和市场暂停都展示为明确提示。', '关键事件暂停同时影响买入和卖出按钮。']}
          />

          <ChangeComparisonRow
            index="10"
            title="历史能力边界说明"
            scope="AppShell / SoccerBetSlipFloat / SoccerPrediction* / CLOB"
            summary="将传统投注、串关、Cash Out、预测大赛和 CLOB 统一标注为本版本暂不交付或独立产品线，不写成永久删除。"
            before={<OldGlobalResidualPreview />}
            after={<NewV6BoundaryPreview />}
            paths={['src/layouts/AppShell.tsx', 'src/components/soccer/SoccerBetSlipFloat.tsx', 'src/pages/ClobPage.tsx']}
            statusTags={['历史资产', '本版暂不交付', '后续待确认']}
            notes={['传统浮动投注条不作为 v7 主入口，但不据此删除历史组件。', '订单簿、限价单、撤单等属于独立 CLOB 产品线。', '串关、Cash Out、传统我的注单和历史预测玩法后续形态需产品确认。']}
          />

          <ChangeComparisonRow
            index="11"
            title="比赛详情报价选择状态"
            scope="v6 AMM match detail → v7 quote match detail"
            summary="比赛详情保留 outcome 选中和右栏结构，但右栏交易预估从 AMM 曲线 quote 调整为买入报价 / 退出报价。"
            before={<V6AmmMatchInteractionPreview />}
            after={<NewV6MatchInteractionPreview />}
            paths={['src/pages/SoccerMatchPage.tsx', 'src/components/soccer/AmmTradePanel.tsx']}
            statusTags={['v6 基线', 'v7 目标']}
            notes={['左侧保留 v6 outcome 卡片高亮和持仓摘要。', '右侧把 AMM 预估改为最新报价。', '串关本版本暂不交付，但不在 Design Board 写成永久删除。']}
          />

          <ChangeComparisonRow
            index="12"
            title="报价变化与交易反馈"
            scope="v6 AMM quote → v7 latest quote"
            summary="v6 交易反馈围绕 AMM 价格影响和过期 quote；v7 交易反馈围绕报价有效期、报价更新和重新询价。"
            before={<V6AmmQuoteLifecyclePreview />}
            after={<NewAmmQuoteLifecyclePreview />}
            paths={['src/components/soccer/AmmTradePanel.tsx', 'src/stores/soccerAmmStore.ts']}
            statusTags={['报价生命周期', '交易保护']}
            notes={['v6 的 price impact 只作为基线对照。', 'v7 用户看到的是报价有效期和报价更新提示。', '报价失败不会展示为等待订单。']}
          />

          <ChangeComparisonRow
            index="13"
            title="Portfolio 与退出能力"
            scope="v6 AMM Portfolio → v7 quote Portfolio"
            summary="Portfolio 主结构保留，但退出能力从 AMM sell 调整为获取退出报价后卖出。"
            before={<V6AmmPortfolioToolsPreview />}
            after={<NewV6PortfolioToolsPreview />}
            paths={['src/pages/SoccerMyBetsPage.tsx', 'src/components/soccer/AmmPortfolioPanel.tsx']}
            statusTags={['退出报价', 'Portfolio 主视图']}
            notes={['v7 当前退出能力通过获取退出报价后卖出表达。', '传统 Cash Out 是否回归为独立能力需产品确认。', '导出注单不是本版本主流程，可后续作为成交导出重新定义。']}
          />

          <ChangeComparisonRow
            index="14"
            title="冠军与晋级页面信息"
            scope="v6 AMM futures → v7 quote futures"
            summary="冠军与晋级页保留系列赛、阶段分组、关闭时间和结算来源，但长期市场从 AMM position 调整为报价交易 position。"
            before={<V6AmmFuturesCodePreview />}
            after={<NewV6FuturesCodePreview />}
            paths={['src/pages/SoccerFuturesPage.tsx', 'src/data/soccer/futuresData.ts']}
            statusTags={['11/11 长期市场', '最新报价']}
            notes={['对象卡和阶段分组保留。', '投注方式说明改为获取报价后买入 / 卖出。', '关闭时间和结算来源继续保留，但服务 resolution 而非注单。']}
          />

          <ChangeComparisonRow
            index="15"
            title="术语与按钮文案产品化"
            scope="v6 AMM copy → v7 quote copy"
            summary="所有用户可见的 AMM 池、价格影响、流动性语义，都必须在 v7 主流程替换为最新报价、锁价和退出报价。"
            before={<V6AmmTerminologyPreview />}
            after={<NewV6TerminologyPreview />}
            paths={['src/components/soccer', 'src/pages/SoccerDesignBoardPage.tsx']}
            statusTags={['术语全覆盖', '文案验收']}
            notes={['v6 基线可以保留 AMM 词作为对照。', 'v7 目标侧必须展示最新报价、报价有效期、退出报价和成交价锁定。', '欧洲赔率只能作为展示换算。']}
          />

          <ChangeComparisonRow
            index="16"
            title="足球首页冠军与晋级入口文案"
            scope="SoccerPage / futures competition cards"
            summary="首页不仅有比赛列表价格列，也有冠军与晋级卡片；v7 需要把该入口的交易说明同步为报价有效期、即时询价和可交易市场。"
            before={<V6SoccerHomeEntryCopyPreview />}
            after={<NewSoccerHomeEntryCopyPreview />}
            paths={['src/pages/SoccerPage.tsx', 'src/data/soccer/futuresData.ts']}
            statusTags={['首页入口', '冠军与晋级', '文案覆盖']}
            notes={['单场与长期市场入口都要显示同一套报价交易心智。', '卡片中的 option 标签不再使用实现术语。', '关闭时间、系列赛入口和 More 入口保留。']}
          />

          <ChangeComparisonRow
            index="17"
            title="全局浮动入口与旧交易条隔离"
            scope="AppShell / ParlaySlip / SoccerBetSlipFloat"
            summary="v6 历史浮动投注条可能因持久化旧数据在足球页出现；v7 足球路由必须只展示报价交易面板，不再显示旧串单条或足球投注单浮条。"
            before={<V6GlobalSlipEntryPreview />}
            after={<NewGlobalSlipEntryPreview />}
            paths={['src/layouts/AppShell.tsx', 'src/components/soccer/SoccerBetSlipFloat.tsx', 'src/components/ParlaySlip.tsx']}
            statusTags={['全局入口', '持久化旧数据', '足球路由隔离']}
            notes={['进入 /soccer、/soccer/match、/soccer/futures、/soccer/mybets 时隐藏旧浮动条。', '旧组件不删除，避免越权移除历史能力。', 'v7 足球主交易入口只保留右栏交易面板和 Portfolio。']}
          />

          <StateCard title="实现文件覆盖核对" description="把最近 v7 前端改动逐一映射到上方差异行，避免只展示部分变化。">
            <CoverageList
              compact
              status="covered"
              items={[
                ['SoccerPage', '01 / 16', '比赛列表价格列、冠军与晋级入口、即时询价和报价标签。'],
                ['SoccerMatchPage', '02 / 03 / 04 / 11', '7 个单场市场、结果选择、右栏交易面板和持仓摘要。'],
                ['SoccerFuturesPage', '08 / 14', '11 个赛事级市场、长期持仓、关闭时间和结算来源。'],
                ['SoccerMyBetsPage', '06 / 07 / 13', '我的页面从注单中心改为 Portfolio 持仓管理。'],
                ['AmmTradePanel', '04 / 05 / 09 / 11 / 12 / 15', '买入、卖出、退出报价、报价有效期、报价失败和按钮文案。'],
                ['AmmMarketRenderer', '02 / 03 / 15', '市场卡片价格说明、即时报价和成交以最新报价为准。'],
                ['AmmPortfolioPanel', '06 / 07 / 13', '可卖份额、退出参考价、已实现和未实现盈亏。'],
                ['soccerAmmStore', '05 / 12', '报价过期、买入成交、卖出成交和交易历史状态提示。'],
                ['ammMarkets / ammData', '03 / 08 / 09 / 14 / 15', '市场覆盖、报价有效期、价格换算和状态数据。'],
                ['AppShell', '10 / 17', '旧串单条和足球投注单浮条在足球路由隔离。'],
              ]}
            />
          </StateCard>
        </div>
      </BoardSection>

        </>
      )}
    </div>
  )
}

function V6FullDesignBoardTab() {
  const v6PageCoverage = [
    ['足球首页', '/soccer', '单场预测 / 冠军与晋级、联赛导航、进行中/即将开赛、AMM 参考价格列、小齿轮价格设置、More 入口。'],
    ['比赛详情', '/soccer/match/:matchId', '面包屑、比赛头部、市场 tab、7 个 AMM 单场市场、右栏赛事信息、交易面板、Portfolio 摘要。'],
    ['冠军与晋级详情', '/soccer/futures/:competitionId', '系列赛对象、阶段分组、11 个赛事级 AMM 市场、关闭时间、结算来源、右栏交易与持仓。'],
    ['Portfolio', '/soccer/mybets', '当前持仓、可卖份额、均价、现价、市值、已实现/未实现盈亏、最近成交和卖出入口。'],
    ['Design Board', '/soccer/design-board', '本页默认展示 v6.0 AMM → v7.0 报价交易对比，另保留 v6 基线 tab。'],
  ]
  const v6MarketCoverage = [
    ...LEAN_MARKET_ORDER.map((title) => [title, '单场 7/7', 'v6 使用 AMM outcome、概率 + 份额价格、24h Vol. 和 24h 涨跌幅；交易状态由卡片视觉表达。']),
    ...futureMarketCoverage.map((item) => [item.title, '冠军与晋级 11/11', `${item.text}｜v6 使用长期 AMM position，可买入、部分卖出、全部卖出。`]),
  ]
  const v6StateCoverage = [
    ['市场状态', 'open / paused / closed / settled / void', '分别展示可交易、暂停交易、关闭、已结算、作废退款。'],
    ['交易状态', '未选 / 买入 / 卖出 / 部分卖出 / 全部卖出', '全部通过 AMM quote 即时成交，不产生挂单或部分成交挂起。'],
    ['Quote 风险', '过期 / 余额不足 / 价格影响过高 / 市场暂停', '整笔交易失败并重新询价，不能沿用旧报价。'],
    ['Portfolio 生命周期', '持仓 / 最近成交 / 已实现盈亏 / 未实现盈亏 / settled / void', '以 position 和 trade 为中心，不再以注单为中心。'],
    ['比赛异常映射', 'live / postponed / cancelled / abandoned / interrupted', '映射为 AMM 市场暂停、关闭、void 或结果争议。'],
    ['价格显示', '55% + Buy Yes 55¢ + 欧赔 1.82', '默认同时展示概率和份额价格，欧洲赔率仅为切换展示。'],
  ]

  return (
    <>
      <BoardSection id="v6-overview" title="v6.0 AMM 基线 Design Board 总览" description="本 tab 保留 v6.0 AMM 基线语境，供 v7 报价交易对比使用。传统投注单、串关、Cash Out、订单簿和 CLOB 等历史能力只作为边界说明，后续形态需产品确认。">
        <div className="grid gap-4 xl:grid-cols-3">
          <StateCard title="页面覆盖 5/5" description="当前足球 tab 正式路由与设计评审页全部覆盖。">
            <CoverageList items={v6PageCoverage} status="active" />
          </StateCard>
          <StateCard title="核心组件覆盖" description="v6 激活组件直接进入完整展板和变更对比。">
            <CoverageList items={v6ActiveCoverage} compact status="active" />
          </StateCard>
          <StateCard title="待确认边界" description="这些内容不作为当前主交付项，不等于永久删除。">
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
          <StateCard title="/soccer 左侧导航" description="联赛筛选、全部赛事、进行中和即将开赛保持现有信息架构。">
            <LeagueSidebarPreview />
          </StateCard>
          <StateCard title="/soccer AMM 比赛列表" description="同一列表位置展示概率 + 份额价格、24h Vol. 和 24h 涨跌幅，成交以 AMM quote 为准。">
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

      <BoardSection id="v6-markets" title="v6.0 市场全量覆盖" description="当前可见市场全部沿用 outcome 结构并接入 AMM quote。这里给出 7/7 单场和 11/11 冠军与晋级的覆盖证明。">
        <StateCard title="单场 7 个核心市场" description="保持当前名称、入口和排序，只替换价格和交易模型。">
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
          <p className="mb-3 text-xs font-semibold text-red-300">v6.0 AMM 基线</p>
          {before}
        </div>
        <div className="rounded-xl border border-[#2DD4BF]/25 bg-[#2DD4BF]/5 p-4">
          <p className="mb-3 text-xs font-semibold text-[#2DD4BF]">v7.0 报价交易目标</p>
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
    <UiPanel title="比赛列表 · v6 AMM 价格列">
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
            {['主 55% · Buy 55¢', '平 29% · Buy 29¢', '客 24% · Buy 24¢', '大 49% · Buy 49¢', '小 56% · Buy 56¢'].map((item) => (
              <div key={item} className="rounded border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 text-center text-[10px] font-mono text-[var(--text-primary)]">{item}</div>
            ))}
          </div>
        </div>
        <p className="text-[10px] leading-5 text-[var(--text-secondary)]">数字含义：v6 AMM 概率和份额价格，成交以 AMM 预估为准。</p>
      </div>
    </UiPanel>
  )
}

function NewAmmMarketListPreview() {
  return (
    <UiPanel title="比赛列表 · v7 最新报价列">
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
        <p className="text-[10px] leading-5 text-[var(--text-secondary)]">数字含义：默认同时展示概率和 Buy 份额价格；欧洲赔率只在齿轮弹框中切换展示，成交以交易面板最新报价为准。</p>
      </div>
    </UiPanel>
  )
}

function OldOutcomeButtonsPreview() {
  return (
    <UiPanel title="市场卡片 · v6 AMM outcome">
      <div className="rounded-lg bg-[var(--bg-control)] p-3">
        <p className="mb-2 text-xs font-semibold text-[var(--text-primary)]">胜平负</p>
        <div className="grid grid-cols-3 gap-2">
          {['RJ博塔弗戈 55% · Buy 55¢', '平局 29% · Buy 29¢', '米拉索尔 24% · Buy 24¢'].map((item) => (
            <button key={item} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-3 text-center text-[10px] text-[var(--text-primary)]">{item}</button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-[var(--text-secondary)]">点击：右栏展示 AMM 预估价格、份额和价格影响。</p>
      </div>
    </UiPanel>
  )
}

function NewAmmOutcomeButtonsPreview() {
  return (
    <UiPanel title="市场卡片 · v7 outcome">
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
    <UiPanel title="7 个单场市场 · v6 AMM 语义">
      <div className="grid gap-2 md:grid-cols-2">
        {LEAN_MARKET_ORDER.map((title) => (
          <div key={title} className="rounded-lg bg-[var(--bg-control)] px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[var(--text-primary)]">{title}</span>
              <span className="font-mono text-[10px] text-[var(--text-secondary)]">AMM 价格</span>
            </div>
            <p className="mt-1 text-[9px] text-[var(--text-secondary)]">点击 outcome 后查看 AMM 预估</p>
          </div>
        ))}
      </div>
    </UiPanel>
  )
}

function NewAmmSingleMarketCoveragePreview() {
  return (
    <UiPanel title="7 个单场市场 · v7 报价交易语义">
      <div className="grid gap-2 md:grid-cols-2">
        {LEAN_MARKET_ORDER.map((title) => (
          <div key={title} className="rounded-lg border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[var(--text-primary)]">{title}</span>
              <span className="font-mono text-[10px] text-[#2DD4BF]">概率价格</span>
            </div>
            <p className="mt-1 text-[9px] text-[var(--text-secondary)]">点击 outcome 后在右栏获取最新报价</p>
          </div>
        ))}
      </div>
    </UiPanel>
  )
}

function OldBetSlipPanelPreview() {
  return <BetSlipPreview title="右栏 AMM 交易面板" lines={['买入份额 / 卖出份额', '胜平负 · 主胜 55%', 'AMM 预估 55¢', '价格影响 1.8%']} footer="确认买入" />
}

function NewAmmTradePanelPreview() {
  return (
    <UiPanel title="右栏交易面板">
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <span className="rounded-lg bg-[#2DD4BF]/15 px-3 py-2 text-center text-xs text-[#2DD4BF]">买入份额</span>
          <span className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-center text-xs text-[var(--text-secondary)]">卖出份额</span>
        </div>
        <div className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[var(--text-secondary)]">投入金额</span>
            <span className="font-mono text-[var(--text-primary)]">50 USDT <span className="text-[#2DD4BF]">Max</span></span>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1">
            {[50, 100, 200, 500].map((value) => (
              <span key={value} className="rounded bg-[var(--bg-card)] px-2 py-1 text-center text-[10px] text-[var(--text-secondary)]">{value}</span>
            ))}
          </div>
        </div>
        {[
          ['买入报价', '55% / 55¢ / 欧赔 1.82'],
          ['报价变化', '1.2%'],
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
    <UiPanel title="v6 AMM 交易状态">
      <div className="grid gap-2 md:grid-cols-2">
        {['未选择 outcome', '买入 quote', '卖出 quote', '部分卖出', '全部卖出', '余额不足', 'quote 过期', '价格影响过高'].map((item) => (
          <div key={item} className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function NewAmmTradeStateMatrixPreview() {
  return (
    <UiPanel title="v7 交易面板状态">
      <div className="grid gap-2 md:grid-cols-2">
        {[
          ['未选择 outcome', '等待选择市场'],
          ['买入报价', '成交价 / 份额 / 最大亏损'],
          ['部分卖出', '输入份额，保留剩余 position'],
          ['全部卖出', '一键清空可卖份额'],
          ['余额不足', '不可确认买入'],
          ['报价过期', '重新询价'],
          ['报价失败', '调整金额或稍后再试'],
          ['报价已变化', '重新获取最新报价'],
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
  return <BetSlipPreview title="v6 Portfolio / 我的持仓" lines={['当前持仓 / 最近成交 / 已结算', '胜平负 · 主胜 55%', '份额 84.00 · 均价 52¢', 'AMM 现价 54¢']} footer="卖出份额" />
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
    <UiPanel title="v6 AMM position 生命周期">
      <div className="space-y-2">
        {['当前持仓', 'AMM 部分卖出', '全部卖出后关闭 position', '结算 / void'].map((item) => (
          <div key={item} className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function NewPortfolioStateMatrixPreview() {
  return (
    <UiPanel title="v7 position 生命周期">
      <div className="space-y-2">
        {[
          ['当前持仓', '份额、均价、退出参考价、市值'],
          ['部分卖出后', '按退出报价成交、剩余份额和已实现盈亏'],
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
    <UiPanel title="冠军与晋级 · v6 AMM 市场">
      <div className="space-y-2">
        <Pill tone="pink">世界杯 2026 · 冠军</Pill>
        {['法国 17% · Buy Yes 17¢', '巴西 16% · Buy Yes 16¢', '阿根廷 14% · Buy Yes 14¢'].map((item) => (
          <div key={item} className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-xs text-[var(--text-primary)]">{item}</div>
        ))}
        <p className="text-[10px] text-[var(--text-secondary)]">组合交易本版本暂不交付，后续形态待产品确认。</p>
      </div>
    </UiPanel>
  )
}

function NewAmmFuturesMarketPreview() {
  return (
    <UiPanel title="冠军与晋级 · 长期报价市场">
      <div className="space-y-2">
        <Pill tone="green">世界杯 2026 · outcome</Pill>
        {['法国 17% · Buy Yes 17¢ · 24h Vol. $3.1k · +1.4%', '巴西 16% · Buy Yes 16¢ · 24h Vol. $2.9k · -0.6%', '阿根廷 14% · Buy Yes 14¢ · 24h Vol. $2.4k · +0.2%'].map((item) => (
          <div key={item} className="rounded-lg bg-[#2DD4BF]/5 px-3 py-2 text-xs text-[var(--text-primary)]">{item}</div>
        ))}
        <p className="text-[10px] text-[var(--text-secondary)]">买入后形成长期持仓，可获取退出报价后部分卖出、全部卖出或等待官方结算。</p>
      </div>
    </UiPanel>
  )
}

function OldSettingsAndErrorPreview() {
  return (
    <UiPanel title="v6 价格设置 + AMM 风险反馈">
      <div className="space-y-2">
        <div className="flex gap-1.5">{['欧洲盘', '分数盘', '美式盘'].map((item) => <Pill key={item}>{item}</Pill>)}</div>
        <BetSlipPreview title="交易失败" lines={['AMM quote 已过期', '价格影响过高', '市场暂停交易']} footer="重新询价" tone="warning" />
      </div>
    </UiPanel>
  )
}

function NewPriceAndRiskPreview() {
  return (
    <UiPanel title="价格切换 + 报价风险反馈">
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
        {['报价已过期，请重新询价', '报价暂不可用，请调整金额或稍后再试', '关键事件暂停，买入和卖出均不可用'].map((item) => (
          <div key={item} className="rounded-lg bg-amber-500/10 px-3 py-2 text-[10px] text-amber-300">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function OldGlobalResidualPreview() {
  return (
    <UiPanel title="v6 待确认历史能力边界">
      <div className="space-y-2">
        {[
          ['浮动投注条', '不作为 AMM 主交易入口，后续形态需确认'],
          ['传统投注单', '历史能力保留为边界说明，不作为 v6 AMM 基线主流程'],
          ['预测玩法入口', '与足球交易主流程分离，后续形态需确认'],
          ['订单簿玩法', '独立产品线，不作为 AMM 基线主流程'],
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
    <UiPanel title="v7 可见入口与边界">
      <div className="space-y-2">
        {[
          ['足球首页', '展示比赛列表和冠军与晋级入口'],
          ['比赛详情', '只展示 outcome、交易面板和持仓摘要'],
          ['我的页面', '只展示 Portfolio 和交易历史'],
          ['待确认边界', '串关、Cash Out、传统投注单和扩展玩法后续需产品确认'],
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

function V6AmmMatchInteractionPreview() {
  return (
    <UiPanel title="v6 AMM 比赛详情交互">
      <div className="grid gap-2 md:grid-cols-2">
        {['outcome 卡片高亮', '右栏显示 AMM 预估', '7/7 市场 outcome 化', '买入/卖出双模式', '右栏展示持仓摘要', '市场暂停影响买入和卖出'].map((item) => (
          <div key={item} className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function NewV6MatchInteractionPreview() {
  return (
    <UiPanel title="v7 报价交易比赛详情交互">
      <div className="grid gap-2 md:grid-cols-2">
        {['outcome 卡片高亮', '右栏显示最新报价', '7/7 市场全部 outcome 化', '买入/卖出双模式', '右栏展示持仓摘要', '市场暂停影响买入和卖出'].map((item) => (
          <div key={item} className="rounded-lg border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function V6AmmQuoteLifecyclePreview() {
  return (
    <UiPanel title="v6 AMM 交易反馈">
      <div className="space-y-2">
        {['选择 outcome 后显示 AMM quote', '展示均价、价格影响和手续费', '报价过期后提示重新询价', '价格影响过高整笔失败', '成交后更新持仓和交易历史'].map((item) => (
          <div key={item} className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function NewAmmQuoteLifecyclePreview() {
  return (
    <UiPanel title="v7 报价交易反馈">
      <div className="space-y-2">
        {['选择 outcome 后获取最新报价', '展示成交报价、报价变化和手续费', '报价过期后提示重新询价', '报价失败时整笔失败', '成交后更新持仓和交易历史'].map((item) => (
          <div key={item} className="rounded-lg border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function V6AmmPortfolioToolsPreview() {
  return (
    <UiPanel title="v6 AMM Portfolio 工具">
      <div className="grid gap-2 md:grid-cols-2">
        {['按单场/冠军与晋级筛选持仓', '查看份额、均价、现价、市值', 'AMM 卖出入口', '最近成交记录', '已实现/未实现盈亏', 'settled / void 按持仓生命周期处理'].map((item) => (
          <div key={item} className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function NewV6PortfolioToolsPreview() {
  return (
    <UiPanel title="v7 Portfolio 工具">
      <div className="grid gap-2 md:grid-cols-2">
        {['按单场/冠军与晋级筛选持仓', '查看份额、均价、退出参考价、市值', '获取退出报价后卖出', '最近成交记录', '已实现/未实现盈亏', '已结算 / void 按持仓生命周期处理'].map((item) => (
          <div key={item} className="rounded-lg border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function V6AmmFuturesCodePreview() {
  return (
    <UiPanel title="v6 AMM 冠军与晋级页面">
      <div className="space-y-2">
        {['定价方式：AMM 概率 + 份额价格', '交易方式：买入/部分卖出/全部卖出', '11/11 长期市场都展示 outcome 卡', '右栏展示 AMM 交易面板和持仓摘要', '关闭时间和结算来源用于结果确认'].map((item) => (
          <div key={item} className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function NewV6FuturesCodePreview() {
  return (
    <UiPanel title="v7 冠军与晋级页面">
      <div className="space-y-2">
        {['定价方式：最新报价 + 份额价格', '交易方式：获取报价后买入 / 获取退出报价后卖出', '11/11 长期市场都展示 outcome 卡', '右栏展示交易面板和持仓摘要', '关闭时间和结算来源用于结果确认'].map((item) => (
          <div key={item} className="rounded-lg border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-3 py-2 text-[10px] text-[var(--text-primary)]">{item}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function V6AmmTerminologyPreview() {
  return (
    <UiPanel title="v6 AMM 预测市场词">
      <div className="flex flex-wrap gap-1.5">
        {['AMM quote', 'price impact', 'liquidity', 'pool', 'outcome', 'shares', 'position', 'sell', 'settlement'].map((item) => <Pill key={item} tone="amber">{item}</Pill>)}
      </div>
    </UiPanel>
  )
}

function NewV6TerminologyPreview() {
  return (
    <UiPanel title="v7 预测交易词">
      <div className="flex flex-wrap gap-1.5">
        {['最新报价', '报价有效期', '成交价锁定', 'outcome', 'shares', 'position', '退出报价', 'settlement', 'reconciliation'].map((item) => <Pill key={item} tone="green">{item}</Pill>)}
      </div>
    </UiPanel>
  )
}

function V6SoccerHomeEntryCopyPreview() {
  return (
    <UiPanel title="v6 首页入口语境">
      <div className="space-y-2">
        {[
          ['单场比赛', 'AMM 参考价格列 + More 入口'],
          ['冠军与晋级', 'AMM 可交易市场，按系列赛进入长期结果份额'],
          ['长期市场标签', '概率 + 份额价格，关闭时间和结算来源保留'],
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

function NewSoccerHomeEntryCopyPreview() {
  return (
    <UiPanel title="v7 首页入口语境">
      <div className="space-y-2">
        {[
          ['单场比赛', '短时有效报价，确认后成交并形成持仓'],
          ['冠军与晋级', '可交易市场 + 即时询价 + 关闭时间'],
          ['长期市场标签', '选项 · 报价，不暴露内部实现术语'],
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

function V6GlobalSlipEntryPreview() {
  return (
    <UiPanel title="v6 全局浮动入口风险">
      <div className="space-y-2">
        {[
          ['足球浮动投注条', '本地已有旧投注项时，离开比赛详情仍可能浮出'],
          ['串单浮动条', '通用串单条可与足球页面同时出现'],
          ['底部留白', '根据浮动条数量动态增加页面底部空间'],
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

function NewGlobalSlipEntryPreview() {
  return (
    <UiPanel title="v7 足球路由全局入口">
      <div className="space-y-2">
        {[
          ['/soccer*', '隐藏旧浮动投注条和串单条'],
          ['比赛详情', '只使用右栏交易面板和 Portfolio 摘要'],
          ['历史能力', '旧组件保留在代码中，后续形态待确认'],
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
        <span className="rounded-full bg-[#2DD4BF]/10 px-2 py-1 text-[10px] text-[#2DD4BF]">预览</span>
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

// =================== v7.1 系列赛 YES/NO 比对面板 ===================

function V71SeriesYesNoTab() {
  return (
    <>
      <BoardSection
        id="v71-series-yesno"
        title="v7.0 单场 ↔ v7.1 系列赛 YES/NO 对比"
        description="只展示系列赛/冠军与晋级类市场（11 类）从单边改为 YES + NO 两腿后的可见变化；单场 7/7 完全不动，本 tab 不再罗列。"
      >
        <div className="rounded-2xl border border-[#E85A7E]/25 bg-[#E85A7E]/5 p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <SmallState title="读法" text="从左到右看：v7.0 单场（或单边）→ v7.1 系列赛 YES + NO 两腿。" />
            <SmallState title="覆盖" text="页面 5/5；系列赛市场 mock 演示门槛 ≥ 2/11，上线门槛 11/11；持仓状态机 9 态命名复用。" />
            <SmallState title="原则" text="单场 7/7 只做回归；返佣展示沿用主站，不在足球 Design Board 重画。" />
          </div>
        </div>

        <div className="space-y-6">
          <ChangeComparisonRow
            index="01"
            title="首页系列赛入口卡片：单价 → YES + NO 双价位"
            scope="SoccerPage / 系列赛入口卡"
            summary="v7.0 首页系列赛入口卡仅展示候选 + 报价文案；v7.1 加 「v7.1 系列赛 YES + NO 已开放」徽标与候选行的「是 odds / 否 odds」双价位 mini 预览，NO 侧若为参考价加 * 注脚。"
            before={<V71OldFuturesEntryPreview />}
            after={<V71NewFuturesEntryPreview />}
            paths={['src/pages/SoccerPage.tsx', 'src/data/soccer/futuresData.ts']}
            statusTags={['首页', '入口卡', 'YES + NO 双价位']}
            notes={[
              '徽标只在含 binary 子市场的系列赛卡上出现（mock 演示门槛 ≥ 2/11）。',
              'NO 侧 odds 在 mock 中按互补推导，带「参考价」星号；上线后报价方直接下发可去掉。',
              '单场比赛列表卡（MatchListCard）只回归不动。',
            ]}
          />

          <ChangeComparisonRow
            index="02"
            title="系列赛市场卡：单按钮列表 → 候选行 + 是/否双列"
            scope="AmmMarketRenderer / SoccerFuturesPage"
            summary="v7.0 系列赛市场把每个候选当一个 outcome 单按钮；v7.1 检测 isBinaryFutureMarket 后按候选分组渲染，行内并排「是」「否」两个按钮，是为绿、否为红，参考价单独徽标。"
            before={<V71OldSeriesMarketPreview />}
            after={<V71NewSeriesMarketPreview />}
            paths={['src/components/soccer/AmmMarketRenderer.tsx', 'src/data/soccer/types.ts']}
            statusTags={['系列赛', '二元子市场', '候选分组']}
            notes={[
              '同一候选下点「是」与点「否」是两次独立 outcome 选择，触发两次独立询价。',
              '行内显示当前已持「是」与已持「否」份额，避免用户误以为只能持一侧。',
              '非 binary 的系列赛市场（如小组出线等）继续走 v7.0 OutcomeGrid。',
            ]}
          />

          <ChangeComparisonRow
            index="03"
            title="交易面板：单 outcome 文案 → side 徽标 + 参考价提示"
            scope="AmmTradePanel"
            summary="v7.0 交易面板只显示 outcome 标题；v7.1 在选中系列赛 outcome 时追加「系列赛 · 是 YES / 否 NO 腿」徽标、参考价徽标、以及「买法国 NO ≠ 买巴西 YES」语义提示。"
            before={<V71OldTradePanelPreview />}
            after={<V71NewTradePanelPreview />}
            paths={['src/components/soccer/AmmTradePanel.tsx', 'src/stores/soccerAmmStore.ts']}
            statusTags={['交易面板', 'side 徽标', '参考价']}
            notes={[
              'side 维度由 outcome.binarySide 决定，单场 outcome 不带 side，不显示徽标。',
              '参考价文案统一为「参考价（成交以最新报价为准）」，与 PRD 5.3、移动端 v7.1 第 5 节一致。',
              '买/卖（buy/sell）侧的二级切换与 v7.0 完全一致，未做改动。',
            ]}
          />

          <ChangeComparisonRow
            index="04"
            title="Portfolio：单行列表 → 候选分组 / 是与否分行 / 结算徽标"
            scope="AmmPortfolioPanel / SoccerMyBetsPage"
            summary="v7.0 持仓单行展示；v7.1 系列赛持仓按 (subject + market + candidate) 分组，组内「是 YES」与「否 NO」分行展示与卖出；已结算分别标注胜出 / 失败 / Void 退款；不展示净持仓与 YES − NO 合并均价。"
            before={<V71OldPortfolioPreview />}
            after={<V71NewPortfolioPreview />}
            paths={['src/components/soccer/AmmPortfolioPanel.tsx', 'src/data/soccer/ammData.ts']}
            statusTags={['Portfolio', '四向分组', '结算徽标']}
            notes={[
              '同一候选下持有 YES + NO 不阻断，但不展示合并行；UI 不主动建议这种组合。',
              '只能卖出当前 side 持仓，卖出按钮明示「卖出 是 YES」或「卖出 否 NO」。',
              '已结算行不再显示「卖出」入口，只保留胜出 / 失败 / Void 退款徽标。',
              '单场持仓走旧的单行展示，未受影响。',
            ]}
          />

          <ChangeComparisonRow
            index="05"
            title="成交历史与 CSV：新增 side 列；单场成交 side 为空"
            scope="AmmPortfolioPanel 成交历史"
            summary="v7.0 成交历史只有 buy/sell；v7.1 成交历史新增「YES / NO」徽标列（仅系列赛二元子市场出现），并在 CSV 导出沿用现有字段、追加 side 列，单场 7/7 成交 side 列为空。"
            before={<V71OldTradeHistoryPreview />}
            after={<V71NewTradeHistoryPreview />}
            paths={['src/components/soccer/AmmPortfolioPanel.tsx', 'src/stores/soccerAmmStore.ts']}
            statusTags={['成交历史', 'side 列', 'CSV 兼容']}
            notes={[
              '旧列（操作、市场、outcome、金额）不删，新增 side 列为可选展示。',
              'CSV 字段命名与主站现行口径一致：空字符串代表单场 / 非 binary 成交。',
              '结算流水沿用 v7.0 通道，不在本展板单独展示。',
            ]}
          />

          <ChangeComparisonRow
            index="06"
            title="返佣展示位：沿用主站，不在足球 Design Board 重画"
            scope="主站返佣展示位"
            summary="v7.1 不在足球 RFQ 内重画返佣展示组件；统一沿用主站现有「直推 + 代理（无限级）」展示位，足球 RFQ 仅作为成交计入主站返佣引擎的来源之一。"
            before={<V71OldRebatePreview />}
            after={<V71NewRebatePreview />}
            paths={['（不动足球前端代码；指向主站返佣展示模块）']}
            statusTags={['返佣', '沿用主站', '不重画']}
            notes={[
              'PRD v7.1 第 8 节已明确：足球 RFQ 全部成交计入主站返佣，事件命名 / 归因配置走主站现行规范，本 PRD 不展开。',
              '若主站对外不展示返佣，则足球 RFQ 也不在用户端暴露。',
              '本展板只标注「沿用主站返佣展示」，不再绘制返佣组件预览。',
            ]}
          />
        </div>
      </BoardSection>

      <BoardSection
        id="v71-coverage-matrix"
        title="v7.1 覆盖矩阵 + 历史能力沿用 v7.0 口径"
        description="给出 v7.1 增量在页面 / 市场 / 状态 / 文案 / 历史能力上的覆盖矩阵，以及 mock 演示门槛与上线门槛的区分。"
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <StateCard
            title="页面 / 组件覆盖 5/5"
            description="所有页面与组件的 v7.1 增量改造点。"
          >
            <CoverageList
              items={[
                ['SoccerPage 首页', '01', '系列赛入口卡新增徽标 + YES/NO mini 双价位预览。'],
                ['SoccerFuturesPage 系列赛', '02', '系列赛市场卡走 BinaryCandidateGrid 双列布局。'],
                ['SoccerMatchPage 单场详情', '—', '只回归不动，不在 v7.1 改造范围。'],
                ['SoccerMyBetsPage 持仓主视图', '04 / 05', 'Portfolio 候选分组、YES/NO 分行、side 列。'],
                ['SoccerDesignBoardPage 自身', '01-06', '本 tab 即覆盖证据，v7.1 默认展示。'],
              ]}
              status="active"
              compact
            />
          </StateCard>

          <StateCard
            title="市场覆盖：演示门槛 2/11 vs 上线门槛 11/11"
            description="mock 演示门槛仅做产品评审与开发对照；上线必须 11/11 全量改造，两档门槛在 PRD 与审计中硬分开。"
          >
            <CoverageList
              items={[
                ['世界杯冠军 (wc-winner)', 'mock 演示 ✅', '法国 / 巴西 / 阿根廷 / 西班牙 各 YES + NO 双侧。'],
                ['英超冠军 (pl-winner)', 'mock 演示 ✅', '阿森纳 / 曼城 / 利物浦 / 切尔西 各 YES + NO 双侧。'],
                ['其他 9 类系列赛', '上线门槛 11/11', '小组赛 / 淘汰赛 / 资格 / 名次 / 两回合系列赛等，按 PRD 上线门槛全量改造，本期 mock 不演示。'],
              ]}
              compact
            />
          </StateCard>

          <StateCard
            title="状态机：沿用 v7.0 第 9 节 9 态命名"
            description="持仓状态机不引入新名字，只在每个状态上扩展 side 维度。"
          >
            <div className="grid gap-2 md:grid-cols-3 text-[10px]">
              {['Active', 'Selling', 'Reduced', 'Closed', 'Settling', 'SettledWon', 'SettledLost', 'VoidRefunded', 'Suspended'].map((s) => (
                <div key={s} className="rounded-lg bg-[var(--bg-control)] px-3 py-2">
                  <p className="font-mono text-[var(--text-primary)]">{s}</p>
                  <p className="mt-1 text-[var(--text-secondary)]">YES / NO 各一条独立状态机，互不共享</p>
                </div>
              ))}
            </div>
          </StateCard>

          <StateCard
            title="历史能力沿用 v7.0 口径（不写永久删除）"
            description="v7.1 不改变 v7.0 第 3.2 节列出的历史能力暂不交付口径；审计章节会做关键词检索校验。"
          >
            <CoverageList
              items={[
                ['串关 / 多笔单注', '不写永久删除', '后续可设计为组合 RFQ 或独立模块。'],
                ['Cash Out', '不写永久删除', '当前退出能力通过获取退出报价后卖出实现。'],
                ['传统投注单 / 我的注单', '不写永久删除', '主视图为 Portfolio；历史兼容形态待确认。'],
                ['扩展盘口 / 球员 / 角球', '不写永久删除', 'provider 可同步但需白名单过滤。'],
                ['v4.5 整届赛事预测大赛', '不写永久删除', '不进入当前 v7 RFQ 主流程。'],
                ['足球 CLOB', '不写永久删除', '独立产品线，不进入当前 RFQ 主流程。'],
              ]}
              compact
              status="excluded"
            />
          </StateCard>
        </div>

        <StateCard
          title="语义防混用：买「法国 NO」≠ 买「巴西 YES」"
          description="PRD v7.1 第 3.3 节、移动端 v7.1 第 3 节、本 Design Board 三处文案对齐，audit 会做关键词检索。"
        >
          <div className="grid gap-2 md:grid-cols-3 text-[10px]">
            <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-300">
              <p className="font-semibold">法国 YES</p>
              <p className="mt-1">仅法国夺冠时获利</p>
            </div>
            <div className="rounded-lg bg-rose-500/10 px-3 py-2 text-rose-300">
              <p className="font-semibold">法国 NO</p>
              <p className="mt-1">除法国外任何一队夺冠都获利（覆盖「其余全部分支」）</p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-300">
              <p className="font-semibold">巴西 YES</p>
              <p className="mt-1">仅巴西夺冠时获利（只覆盖巴西一支）</p>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-[var(--text-secondary)]">
            「法国 NO」与「巴西 YES」在 payoff 结构上不等价；产品文档、UI 文案、客服话术按这一口径解释，不得用「巴西 YES」替代「法国 NO」。
          </p>
        </StateCard>
      </BoardSection>
    </>
  )
}

// ---------- v7.1 比对面板的轻量 preview 组件（不直接引用业务组件，仅作 Design Board 文案/结构示意） ----------

function V71OldFuturesEntryPreview() {
  return (
    <UiPanel title="v7.0 首页系列赛入口卡">
      <div className="rounded-lg bg-[var(--bg-control)] px-3 py-2">
        <p className="text-xs font-semibold text-[var(--text-primary)]">世界杯冠军</p>
        <p className="mt-1 text-[10px] text-[var(--text-secondary)]">法国 · 报价 / 巴西 · 报价</p>
      </div>
    </UiPanel>
  )
}

function V71NewFuturesEntryPreview() {
  return (
    <UiPanel title="v7.1 首页系列赛入口卡">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E85A7E]/10 px-2.5 py-1 text-[10px] font-semibold text-[#E85A7E]">v7.1 系列赛 YES + NO 已开放</div>
        <div className="rounded-lg border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-3 py-2">
          <p className="text-xs font-semibold text-[var(--text-primary)]">世界杯冠军</p>
          <div className="mt-1.5 space-y-1 text-[10px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--text-primary)]">法国</span>
              <span className="flex items-center gap-1.5 font-mono">
                <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-emerald-300">是 5.80</span>
                <span className="rounded bg-rose-500/15 px-1.5 py-0.5 text-rose-300">否 1.21 *</span>
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--text-primary)]">巴西</span>
              <span className="flex items-center gap-1.5 font-mono">
                <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-emerald-300">是 6.20</span>
                <span className="rounded bg-rose-500/15 px-1.5 py-0.5 text-rose-300">否 1.19 *</span>
              </span>
            </div>
            <p className="text-[9px] text-[var(--text-secondary)]">* 否 为参考价（成交以最新报价为准）</p>
          </div>
        </div>
      </div>
    </UiPanel>
  )
}

function V71OldSeriesMarketPreview() {
  return (
    <UiPanel title="v7.0 系列赛市场卡 · 单按钮列表">
      <div className="grid gap-2 grid-cols-2">
        {['法国 5.80', '巴西 6.20', '阿根廷 7.40', '西班牙 8.00'].map((label) => (
          <div key={label} className="rounded-md border border-[var(--border)] bg-[var(--bg-control)] px-3 py-1.5 text-[10px] text-[var(--text-primary)]">{label}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function V71NewSeriesMarketPreview() {
  return (
    <UiPanel title="v7.1 系列赛市场卡 · 候选行 + 是/否双列">
      <div className="space-y-1.5">
        {[
          { name: '法国', yes: '5.80', no: '1.21', ref: true },
          { name: '巴西', yes: '6.20', no: '1.19', ref: true },
          { name: '阿根廷', yes: '7.40', no: '1.16', ref: true },
        ].map((c) => (
          <div key={c.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-md border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-3 py-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)]">{c.name}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">买入「是」押该候选成立；买入「否」押该候选不成立</p>
            </div>
            <div className="min-w-[68px] rounded-md bg-emerald-500/10 px-2.5 py-1 text-center">
              <p className="text-[10px] font-semibold text-emerald-300">是</p>
              <p className="text-[10px] font-mono text-[var(--text-primary)]">{c.yes}</p>
            </div>
            <div className="min-w-[68px] rounded-md bg-rose-500/10 px-2.5 py-1 text-center">
              <p className="text-[10px] font-semibold text-rose-300">否 {c.ref && <span className="text-amber-300">参考价</span>}</p>
              <p className="text-[10px] font-mono text-[var(--text-primary)]">{c.no}</p>
            </div>
          </div>
        ))}
      </div>
    </UiPanel>
  )
}

function V71OldTradePanelPreview() {
  return (
    <UiPanel title="v7.0 交易面板 outcome 区">
      <div className="rounded-lg bg-[var(--bg-control)] p-3">
        <p className="text-xs font-semibold text-[var(--text-primary)]">世界杯冠军</p>
        <p className="mt-1 text-sm text-[#2DD4BF]">法国</p>
        <p className="mt-2 text-[10px] text-[var(--text-secondary)]">FIFA World Cup 2026 · 法国 是否赢得世界杯？</p>
      </div>
    </UiPanel>
  )
}

function V71NewTradePanelPreview() {
  return (
    <UiPanel title="v7.1 交易面板 outcome 区">
      <div className="rounded-lg bg-[var(--bg-control)] p-3">
        <p className="text-xs font-semibold text-[var(--text-primary)]">世界杯冠军</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-sm text-[#2DD4BF]">法国 否</p>
          <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-300">系列赛 · 否 NO 腿</span>
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">参考价（成交以最新报价为准）</span>
        </div>
        <p className="mt-2 text-[10px] text-[var(--text-secondary)]">FIFA World Cup 2026 · 法国 否 是否成立？</p>
        <p className="mt-2 text-[10px] text-[var(--text-secondary)]">
          是与否各自一次询价、一次确认；切换 side、修改候选或金额都会让旧报价失效。买「法国 否」≠ 买「巴西 是」，盈亏结构不同。
        </p>
      </div>
    </UiPanel>
  )
}

function V71OldPortfolioPreview() {
  return (
    <UiPanel title="v7.0 Portfolio 单行">
      <div className="space-y-1.5">
        {['世界杯冠军 · 法国 · 60 份 · 均价 15¢', '英超冠军 · 阿森纳 · 50 份 · 均价 34¢'].map((line) => (
          <div key={line} className="rounded-md bg-[var(--bg-control)] px-3 py-2 text-[10px] text-[var(--text-primary)]">{line}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function V71NewPortfolioPreview() {
  return (
    <UiPanel title="v7.1 Portfolio 候选分组 + YES/NO 分行">
      <div className="space-y-2">
        <div className="rounded-md bg-[var(--bg-control)] p-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-[var(--text-primary)]">世界杯冠军 · 法国</p>
            <span className="rounded-full bg-[#E85A7E]/10 px-2 py-0.5 text-[9px] text-[#E85A7E]">系列赛 二元子市场</span>
          </div>
          <div className="mt-1.5 space-y-1.5 text-[10px]">
            <div className="rounded bg-[var(--bg-card)]/60 px-2 py-1.5">
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-300">是 YES</span>
              <span className="ml-2 text-[var(--text-secondary)]">60 份 · 均价 15¢ · 卖出</span>
            </div>
            <div className="rounded bg-[var(--bg-card)]/60 px-2 py-1.5">
              <span className="rounded-full bg-rose-500/15 px-2 py-0.5 font-semibold text-rose-300">否 NO</span>
              <span className="ml-2 text-[var(--text-secondary)]">25 份 · 均价 84¢ · 卖出</span>
            </div>
          </div>
        </div>
        <div className="rounded-md bg-[var(--bg-control)] p-2">
          <p className="text-xs font-semibold text-[var(--text-primary)]">英超冠军 · 切尔西</p>
          <div className="mt-1.5 rounded bg-[var(--bg-card)]/60 px-2 py-1.5 text-[10px]">
            <span className="rounded-full bg-rose-500/15 px-2 py-0.5 font-semibold text-rose-300">否 NO</span>
            <span className="ml-1 rounded-full bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-300">Void 退款</span>
            <span className="ml-2 text-[var(--text-secondary)]">18 份 · 已结算</span>
          </div>
        </div>
      </div>
    </UiPanel>
  )
}

function V71OldTradeHistoryPreview() {
  return (
    <UiPanel title="v7.0 最近成交">
      <div className="space-y-1">
        {['买入 世界杯冠军 · 法国 · 9.00 USDT', '卖出 英超冠军 · 阿森纳 · 3.35 USDT'].map((line) => (
          <div key={line} className="rounded-md bg-[var(--bg-control)] px-3 py-1.5 text-[10px] text-[var(--text-primary)]">{line}</div>
        ))}
      </div>
    </UiPanel>
  )
}

function V71NewTradeHistoryPreview() {
  return (
    <UiPanel title="v7.1 最近成交（side 列）">
      <div className="space-y-1 text-[10px]">
        <div className="flex items-center gap-1.5 rounded-md bg-[var(--bg-control)] px-3 py-1.5">
          <span className="rounded bg-[#2DD4BF]/15 px-1.5 py-0.5 font-semibold text-[#2DD4BF]">买入</span>
          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-semibold text-emerald-300">YES</span>
          <span className="text-[var(--text-secondary)]">世界杯冠军 · 法国 是</span>
          <span className="ml-auto font-mono text-[var(--text-primary)]">9.00</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md bg-[var(--bg-control)] px-3 py-1.5">
          <span className="rounded bg-[#2DD4BF]/15 px-1.5 py-0.5 font-semibold text-[#2DD4BF]">买入</span>
          <span className="rounded bg-rose-500/15 px-1.5 py-0.5 font-semibold text-rose-300">NO</span>
          <span className="text-[var(--text-secondary)]">世界杯冠军 · 法国 否</span>
          <span className="ml-auto font-mono text-[var(--text-primary)]">21.00</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md bg-[var(--bg-control)] px-3 py-1.5">
          <span className="rounded bg-[#E85A7E]/15 px-1.5 py-0.5 font-semibold text-[#E85A7E]">卖出</span>
          <span className="rounded bg-rose-500/15 px-1.5 py-0.5 font-semibold text-rose-300">NO</span>
          <span className="text-[var(--text-secondary)]">英超冠军 · 阿森纳 否</span>
          <span className="ml-auto font-mono text-[var(--text-primary)]">3.35</span>
        </div>
        <p className="mt-1 text-[9px] text-[var(--text-secondary)]">CSV 导出沿用现有字段，新增 side 列（YES / NO）；单场 7/7 成交 side 列为空。</p>
      </div>
    </UiPanel>
  )
}

function V71OldRebatePreview() {
  return (
    <UiPanel title="v7.0 返佣展示">
      <p className="text-[10px] text-[var(--text-secondary)]">沿用主站现有「直推 + 代理（无限级）」返佣展示位，足球前端不自绘返佣组件。</p>
    </UiPanel>
  )
}

function V71NewRebatePreview() {
  return (
    <UiPanel title="v7.1 返佣展示（不变）">
      <p className="text-[10px] text-[var(--text-secondary)]">
        足球 RFQ 全部成交（含系列赛 YES + NO 双侧）按主站现行规则计入返佣引擎。展示位、事件命名与归因配置走主站规范，本展板不在足球域重画。
      </p>
      <p className="mt-1 text-[10px] text-[var(--text-secondary)]">
        若主站不对外暴露返佣展示，则足球 RFQ 也不在用户端暴露。
      </p>
    </UiPanel>
  )
}

