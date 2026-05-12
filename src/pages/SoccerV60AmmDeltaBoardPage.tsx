import {
  AmmMarketCard,
  AmmPortfolioPanel,
  AmmTradePanel,
  PriceFormatToggle,
} from '../components/soccer/AmmMarketComponents'
import {
  ammMarkets,
  estimateAmmQuote,
  type PriceFormat,
} from '../data/soccer/ammMarkets'
import { useState } from 'react'

const selectedMarket = ammMarkets.find((market) => market.status === 'open') ?? ammMarkets[0]
const selectedOutcome = selectedMarket.outcomes[0]
const futuresMarket = ammMarkets.find((market) => market.category === 'futures') ?? selectedMarket
const highImpactQuote = estimateAmmQuote(selectedMarket, selectedOutcome, 'buy', 4500, 'collateral')

export default function SoccerV60AmmDeltaBoardPage() {
  const [priceFormat, setPriceFormat] = useState<PriceFormat>('probability')

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-6">
      <header className="rounded-2xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2DD4BF]">v6.0 AMM Delta Board</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">传统盘口 UI → AMM 预测份额交易 UI</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--text-secondary)]">
          本页只标注 v6.0 相对传统盘口发生变化的 UI 组件和板块。盘口名称、系列赛结构和可见市场范围不变；
          变化集中在价格表达、交易面板、持仓管理、卖出能力、流动性与结算说明。
        </p>
        <div className="mt-4 grid gap-2 md:grid-cols-4">
          <Metric label="盘口清单" value="不变" />
          <Metric label="交易模型" value="AMM" />
          <Metric label="新增 P0" value="Portfolio" />
          <Metric label="不展示" value="CLOB / 挂单" />
        </div>
      </header>

      <DeltaSection
        eyebrow="Change 1"
        title="价格展示：赔率按钮变为 outcome 价格"
        before="按钮展示平台欧洲赔率，点击后加入投注单。"
        after="按钮展示 outcome 概率价格，可切换等价欧洲赔率；点击后进入 AMM 询价。"
      >
        <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
          <BeforeCard title="之前">
            <div className="grid grid-cols-3 gap-2">
              {['主胜 2.24', '平局 3.45', '客胜 3.20'].map((item) => (
                <div key={item} className="rounded-lg border border-[var(--border)] bg-[var(--bg-control)] p-3 text-center text-xs text-[var(--text-primary)]">
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-[var(--text-secondary)]">设计关注：投注按钮、赔率、选中态。</p>
          </BeforeCard>
          <AfterCard title="现在">
            <div className="mb-3 flex justify-end">
              <PriceFormatToggle value={priceFormat} onChange={setPriceFormat} />
            </div>
            <AmmMarketCard
              market={selectedMarket}
              priceFormat={priceFormat}
              selectedOutcomeId={selectedOutcome.id}
            />
          </AfterCard>
        </div>
      </DeltaSection>

      <DeltaSection
        eyebrow="Change 2"
        title="右栏：投注单变为交易面板"
        before="用户选择多个投注项，输入投注金额，再提交多笔单注或串关。"
        after="用户选择一个 outcome，输入 shares 或金额，买入或卖出都先拿 AMM quote，再确认交易。"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <BeforeCard title="之前">
            <PanelPreview rows={['投注单', '多笔单注 / 串关', '投注金额 100 USDT', '可能返还 224.00 USDT', '提交投注']} />
          </BeforeCard>
          <AfterCard title="现在">
            <AmmTradePanel market={selectedMarket} outcome={selectedOutcome} priceFormat={priceFormat} />
          </AfterCard>
        </div>
      </DeltaSection>

      <DeltaSection
        eyebrow="Change 3"
        title="我的注单变为 Portfolio"
        before="按注单状态筛选，展示投注金额、赔率、返还、提前结清和重投。"
        after="按持仓管理，展示可卖 shares、均价、当前价、已实现 / 未实现盈亏，支持部分卖出和全部卖出。"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <BeforeCard title="之前">
            <PanelPreview rows={['我的注单', '待结算 / 已结算 / 提前结清', '投注 50 USDT @2.24', '可能返还 112 USDT', '提前结清 / 重投']} />
          </BeforeCard>
          <AfterCard title="现在">
            <AmmPortfolioPanel />
          </AfterCard>
        </div>
      </DeltaSection>

      <DeltaSection
        eyebrow="Change 4"
        title="冠军与晋级：结构不变，市场卡片 AMM 化"
        before="系列赛对象内展示市场说明和赔率按钮，赛事级只允许多笔单注。"
        after="仍按系列赛对象和分组展示，但每个市场都是长期 AMM 市场，支持买入、部分卖出、全部卖出或等待结算。"
      >
        <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <BeforeCard title="之前的结构">
            <PanelPreview rows={['世界杯 2026', '小组赛 / 淘汰赛 / 冠军', 'A组第一：墨西哥 2.05', '进入8强：法国 是 1.85', '世界杯冠军：法国 5.80']} />
          </BeforeCard>
          <AfterCard title="现在的同一批市场">
            <AmmMarketCard
              market={futuresMarket}
              priceFormat={priceFormat}
            />
          </AfterCard>
        </div>
      </DeltaSection>

      <DeltaSection
        eyebrow="Change 5"
        title="异常状态：报价风险显性化"
        before="传统投注单主要提示赔率变化、封盘、余额不足和提交失败。"
        after="AMM 交易必须展示价格影响、quote 过期、流动性不足、外部报价暂停和官方争议。"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <SmallState title="高价格影响" text={`当前示例价格影响 ${highImpactQuote.priceImpact.toFixed(2)}%，应触发黄色警示。`} />
          <SmallState title="流动性不足" text="整笔交易失败，不产生挂单或部分成交挂起。" />
          <SmallState title="官方待确认" text="市场可查看但不可买卖，等待结算或 void 规则。" />
        </div>
      </DeltaSection>
    </div>
  )
}

function DeltaSection({
  eyebrow,
  title,
  before,
  after,
  children,
}: {
  eyebrow: string
  title: string
  before: string
  after: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-[#E85A7E]">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
        <div className="mt-2 grid gap-2 text-xs leading-5 md:grid-cols-2">
          <p className="rounded-lg bg-[var(--bg-card)] px-3 py-2 text-[var(--text-secondary)]">之前：{before}</p>
          <p className="rounded-lg bg-[#2DD4BF]/10 px-3 py-2 text-[#8ff5e8]">现在：{after}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function BeforeCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 opacity-75">
      <p className="mb-3 text-xs font-semibold text-[var(--text-secondary)]">{title}</p>
      {children}
    </div>
  )
}

function AfterCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/5 p-4">
      <p className="mb-3 text-xs font-semibold text-[#2DD4BF]">{title}</p>
      {children}
    </div>
  )
}

function PanelPreview({ rows }: { rows: string[] }) {
  return (
    <div className="space-y-2 rounded-xl bg-[var(--bg-control)] p-3">
      {rows.map((row, index) => (
        <div key={row} className="rounded-lg bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-primary)]">
          {index + 1}. {row}
        </div>
      ))}
    </div>
  )
}

function SmallState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{text}</p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--bg-control)] px-3 py-2">
      <p className="text-[10px] text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  )
}
