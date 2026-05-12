import MarketRenderer from '../components/soccer/MarketRenderer'
import { futuresCompetitions } from '../data/soccer/futuresData'

const noop = () => {}

function futureGroups(competition: (typeof futuresCompetitions)[number]): string[] {
  return Array.from(new Set(competition.markets.map((item) => item.group)))
}

function formatCloseTime(iso?: string): string {
  if (!iso) return '按市场规则'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '按市场规则'
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function SoccerV47DeltaBoardPage() {
  const worldCup = futuresCompetitions.find((item) => item.id === 'world-cup-2026') ?? futuresCompetitions[0]
  const groups = futureGroups(worldCup)
  const marketCount = futuresCompetitions.reduce((sum, item) => sum + item.markets.length, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-8">
      <header className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <p className="text-xs font-semibold text-[#2DD4BF]">v4.7 UI 变更专用展板</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">冠军与晋级结构更新</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--text-secondary)]">
          本页面只展示本轮新增和修改的 UI，不替代完整 Design Board。设计师可只核对这里的入口命名、
          冠军与晋级首页卡片、系列赛详情分组和 World Cup 样例。
        </p>
        <div className="mt-4 grid gap-2 md:grid-cols-4">
          <Metric label="新增页面" value="1" />
          <Metric label="系列赛对象" value={String(futuresCompetitions.length)} />
          <Metric label="赛事级市场" value={String(marketCount)} />
          <Metric label="展示范围" value="Delta" />
        </div>
      </header>

      <DeltaSection
        eyebrow="Change 1"
        title="首页一级入口命名"
        description="本轮只改动足球首页主内容区 tab：把旧的“比赛”表达升级为“单场预测”，与“冠军与晋级”形成清晰二分。"
      >
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div className="flex w-fit rounded-xl border border-[var(--border)] bg-[var(--bg-control)] p-1">
            <span className="rounded-lg bg-[#2DD4BF]/15 px-4 py-2 text-sm font-semibold text-[#2DD4BF]">单场预测</span>
            <span className="rounded-lg px-4 py-2 text-sm text-[var(--text-secondary)]">冠军与晋级</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <InfoBlock title="单场预测" text="近期单场比赛结果和内容预测，按比赛逐场下注。" />
            <InfoBlock title="冠军与晋级" text="先选择系列赛或赛季，再进入查看该对象下的小组赛、淘汰赛、冠军等预测。" />
          </div>
        </div>
      </DeltaSection>

      <DeltaSection
        eyebrow="Change 2"
        title="冠军与晋级首页：只展示系列赛 / 赛季对象"
        description="这里不再全局混排所有市场，而是先让用户选择 World Cup、欧冠、英超这类对象。"
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {futuresCompetitions.map((competition) => (
            <SeriesCard key={competition.id} competition={competition} />
          ))}
        </div>
      </DeltaSection>

      <DeltaSection
        eyebrow="Change 3"
        title="系列赛详情：对象内部再分组展示预测"
        description="以世界杯为样例，小组赛、淘汰赛和冠军只出现在 World Cup 对象内部，不放在冠军与晋级全局顶部。"
      >
        <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <aside className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#E85A7E]">{worldCup.region} · {worldCup.seriesType}</p>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{worldCup.shortName}</h2>
            <p className="text-xs leading-5 text-[var(--text-secondary)]">{worldCup.headline}</p>
            <div className="grid gap-2">
              <InfoBlock title="系列状态" text={worldCup.phase} />
              <InfoBlock title="投注方式" text="多笔单注，暂不支持串关" />
              <InfoBlock title="关闭时间" text={formatCloseTime(worldCup.markets[0]?.subject.closesAt)} />
            </div>
          </aside>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {['全部', ...groups].map((group, index) => (
                <span
                  key={group}
                  className={`rounded-lg px-3 py-1.5 text-xs ${
                    index === 0
                      ? 'bg-[#2DD4BF]/15 text-[#2DD4BF]'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'
                  }`}
                >
                  {group}
                </span>
              ))}
            </div>

            {groups.map((group) => (
              <div key={group} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{group}</h3>
                  <span className="rounded-full bg-[var(--bg-card)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">
                    {worldCup.markets.filter((item) => item.group === group).length} 个预测
                  </span>
                </div>
                <div className="space-y-3">
                  {worldCup.markets.filter((item) => item.group === group).map((item) => (
                    <div key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-[#E85A7E]/10 px-2 py-0.5 text-[10px] text-[#E85A7E]">{item.group}</span>
                            <span className="text-[10px] text-[var(--text-secondary)]">{item.subject.resolutionTimeLabel}</span>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{item.description}</p>
                        </div>
                        <div className="text-right text-[10px] text-[var(--text-secondary)]">
                          <p>关闭时间</p>
                          <p className="mt-0.5 font-mono text-[var(--text-primary)]">{formatCloseTime(item.subject.closesAt)}</p>
                        </div>
                      </div>
                      <MarketRenderer market={item.market} displayTitle={item.market.title} matchId={item.subject.subjectId} onSelect={noop} />
                      <p className="mt-2 text-[10px] text-[var(--text-secondary)]">结算来源：{item.subject.resolutionSource}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DeltaSection>
    </div>
  )
}

function SeriesCard({ competition }: { competition: (typeof futuresCompetitions)[number] }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#2DD4BF]">{competition.region} · {competition.seriesType}</p>
          <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{competition.shortName}</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{competition.headline}</p>
        </div>
        <span className="rounded-full bg-[var(--bg-control)] px-2.5 py-1 text-[10px] text-[var(--text-secondary)]">
          {competition.markets.length} 个预测
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {futureGroups(competition).map((group) => (
          <span key={group} className="rounded-full bg-[#E85A7E]/10 px-2 py-0.5 text-[10px] text-[#E85A7E]">{group}</span>
        ))}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {competition.marketSummary.slice(0, 4).map((item) => (
          <div key={item} className="rounded-xl bg-[var(--bg-control)] px-3 py-2 text-xs text-[var(--text-primary)]">
            {item}
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-[var(--border)] pt-3 text-[10px] text-[var(--text-secondary)]">
        进入后再展示该对象内部预测
      </div>
    </div>
  )
}

function DeltaSection({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-[#E85A7E]">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      </div>
      {children}
    </section>
  )
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl bg-[var(--bg-control)] px-3 py-2">
      <p className="text-[10px] text-[var(--text-secondary)]">{title}</p>
      <p className="mt-1 text-xs font-medium text-[var(--text-primary)]">{text}</p>
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
