import { useMemo, useState } from 'react'
import {
  formatAmmPrice,
  formatImpliedProbability,
  type SoccerAmmPosition,
  type SoccerAmmSettlementResult,
} from '../../data/soccer/ammData'
import { useSoccerAmmStore } from '../../stores/soccerAmmStore'

type Filter = 'all' | 'single' | 'futures'

interface CandidateGroup {
  key: string
  subjectLabel: string
  marketTitle: string
  candidateLabel: string
  yes?: SoccerAmmPosition
  no?: SoccerAmmPosition
}

const settlementBadge: Record<SoccerAmmSettlementResult, { label: string; tone: string }> = {
  won: { label: '胜出', tone: 'bg-emerald-500/15 text-emerald-300' },
  lost: { label: '失败', tone: 'bg-rose-500/15 text-rose-300' },
  void_refunded: { label: 'Void 退款', tone: 'bg-amber-500/15 text-amber-300' },
}

export default function AmmPortfolioPanel({ compact = false }: { compact?: boolean }) {
  const [filter, setFilter] = useState<Filter>('all')
  const positions = useSoccerAmmStore((state) => state.positions)
  const trades = useSoccerAmmStore((state) => state.trades)
  const priceFormat = useSoccerAmmStore((state) => state.priceFormat)
  const selectOutcome = useSoccerAmmStore((state) => state.selectOutcome)
  const portfolioValue = useSoccerAmmStore((state) => state.getPortfolioValue())
  const unrealizedPnl = useSoccerAmmStore((state) => state.getUnrealizedPnl())

  const visiblePositions = useMemo(() => {
    if (filter === 'single') return positions.filter((item) => !item.outcomeId.startsWith('future-'))
    if (filter === 'futures') return positions.filter((item) => item.outcomeId.startsWith('future-'))
    return positions
  }, [positions, filter])

  // v7.1：把系列赛二元持仓按候选分组、组内 YES / NO 分行；其它持仓走旧的单行展示。
  const { binaryGroups, soloPositions } = useMemo(() => {
    const groups = new Map<string, CandidateGroup>()
    const solo: SoccerAmmPosition[] = []
    visiblePositions.forEach((position) => {
      if (!position.candidate || !position.binarySide) {
        solo.push(position)
        return
      }
      const key = `${position.subjectLabel}::${position.marketTitle}::${position.candidate}`
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          subjectLabel: position.subjectLabel,
          marketTitle: position.marketTitle,
          candidateLabel: position.outcomeLabel.replace(/\s*(是|否)\s*$/, '').trim(),
        })
      }
      const entry = groups.get(key)!
      if (position.binarySide === 'yes') entry.yes = position
      if (position.binarySide === 'no') entry.no = position
    })
    return { binaryGroups: Array.from(groups.values()), soloPositions: solo }
  }, [visiblePositions])

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Portfolio / 我的持仓</h3>
          <p className="mt-1 text-[10px] text-[var(--text-secondary)]">持仓可获取退出报价后部分卖出、全部卖出或等待结算</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[var(--text-secondary)]">持仓市值</p>
          <p className="text-sm font-mono text-[var(--text-primary)]">{portfolioValue.toFixed(2)} USDT</p>
          <p className={`text-[10px] font-mono ${unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            未实现 {unrealizedPnl >= 0 ? '+' : ''}{unrealizedPnl.toFixed(2)}
          </p>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ['all', '全部'],
            ['single', '单场预测'],
            ['futures', '冠军与晋级'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id as Filter)}
              className={`rounded-lg px-2.5 py-1 text-[10px] transition-colors ${
                filter === id
                  ? 'bg-[#2DD4BF]/15 text-[#2DD4BF]'
                  : 'bg-[var(--bg-control)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-2">
        {visiblePositions.length === 0 && (
          <p className="rounded-lg bg-[var(--bg-control)] px-3 py-4 text-center text-xs text-[var(--text-secondary)]">
            暂无持仓，买入 outcome 后会显示在这里。
          </p>
        )}
        {binaryGroups.slice(0, compact ? 2 : undefined).map((group) => (
          <BinaryCandidateRow
            key={group.key}
            group={group}
            priceFormat={priceFormat}
            onSell={(position) => selectOutcome({
              id: position.outcomeId,
              subject: { scope: 'competition', id: position.outcomeId.split('::')[0], label: position.subjectLabel, resolutionTimeLabel: '官方结果确认后', resolutionSource: '官方结果' },
              marketTitle: position.marketTitle,
              marketKind: 'binary',
              label: position.outcomeLabel,
              questionTitle: `${position.marketTitle} · ${position.outcomeLabel}`,
              resolutionRule: '按市场官方规则结算。',
              probability: position.currentProbability,
              liquidity: 10_000,
              volume24h: 0,
              priceChange24h: 0,
              status: 'open',
              voidRule: '按 void 规则退款。',
              delayOrDisputePolicy: '等待官方确认。',
              binarySide: position.binarySide,
              candidate: position.candidate,
            }, 'sell')}
          />
        ))}
        {soloPositions.slice(0, compact ? 3 : undefined).map((position) => {
          const marketValue = position.shares * position.currentProbability
          const unrealized = position.shares * (position.currentProbability - position.avgPrice)
          return (
            <article key={position.id} className="rounded-lg bg-[var(--bg-control)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[10px] text-[var(--text-secondary)]">{position.subjectLabel}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-[var(--text-primary)]">{position.marketTitle} · {position.outcomeLabel}</p>
                </div>
                <span className={`shrink-0 text-xs font-mono ${unrealized >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {unrealized >= 0 ? '+' : ''}{unrealized.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
                <Metric label="份额" value={position.shares.toFixed(2)} />
                <Metric label="均价" value={formatAmmPrice(position.avgPrice, priceFormat)} />
                <Metric label="退出参考" value={formatAmmPrice(position.currentProbability, priceFormat)} />
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-[var(--border)]/50 pt-2">
                <span className="text-[10px] text-[var(--text-secondary)]">
                  市值 {marketValue.toFixed(2)} USDT · {formatImpliedProbability(position.currentProbability)}
                </span>
                <button
                  onClick={() => selectOutcome({
                    id: position.outcomeId,
                    subject: { scope: position.outcomeId.startsWith('future-') ? 'competition' : 'match', id: position.outcomeId.split('::')[0], label: position.subjectLabel, resolutionTimeLabel: '官方结果确认后', resolutionSource: '官方结果' },
                    marketTitle: position.marketTitle,
                    marketKind: 'binary',
                    label: position.outcomeLabel,
                    questionTitle: `${position.marketTitle} · ${position.outcomeLabel}`,
                    resolutionRule: '按市场官方规则结算。',
                    probability: position.currentProbability,
                    liquidity: 10_000,
                    volume24h: 0,
                    priceChange24h: 0,
                    status: 'open',
                    voidRule: '按 void 规则退款。',
                    delayOrDisputePolicy: '等待官方确认。',
                  }, 'sell')}
                  className="text-[10px] text-[#2DD4BF] hover:underline"
                >
                  卖出
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {!compact && trades.length > 0 && (
        <div className="mt-4 border-t border-[var(--border)] pt-3">
          <p className="mb-2 flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
            <span>最近成交</span>
            <span className="text-[10px] font-normal text-[var(--text-secondary)]">side 列：YES / NO 仅系列赛二元子市场出现</span>
          </p>
          <div className="space-y-1.5">
            {trades.slice(0, 8).map((trade) => (
              <div key={trade.id} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--bg-control)] px-3 py-2 text-[10px]">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className={`rounded px-1.5 py-0.5 font-semibold ${trade.side === 'buy' ? 'bg-[#2DD4BF]/15 text-[#2DD4BF]' : 'bg-[#E85A7E]/15 text-[#E85A7E]'}`}>
                    {trade.side === 'buy' ? '买入' : '卖出'}
                  </span>
                  {trade.binarySide && (
                    <span className={`rounded px-1.5 py-0.5 font-semibold ${trade.binarySide === 'yes' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                      {trade.binarySide === 'yes' ? 'YES' : 'NO'}
                    </span>
                  )}
                  <span className="truncate text-[var(--text-secondary)]">{trade.marketTitle} · {trade.outcomeLabel}</span>
                </div>
                <span className="shrink-0 font-mono text-[var(--text-primary)]">{trade.collateral.toFixed(2)} USDT</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-[var(--text-secondary)]">
            CSV 导出沿用现有字段，新增 side 列（YES / NO）；单场 7/7 成交 side 列为空。
          </p>
        </div>
      )}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[var(--text-secondary)]">{label}</p>
      <p className="mt-0.5 font-mono text-[var(--text-primary)]">{value}</p>
    </div>
  )
}

function BinaryCandidateRow({
  group,
  priceFormat,
  onSell,
}: {
  group: CandidateGroup
  priceFormat: 'probability' | 'european'
  onSell: (position: SoccerAmmPosition) => void
}) {
  return (
    <article className="rounded-lg bg-[var(--bg-control)] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] text-[var(--text-secondary)]">{group.subjectLabel}</p>
          <p className="mt-1 truncate text-xs font-semibold text-[var(--text-primary)]">{group.marketTitle} · {group.candidateLabel}</p>
        </div>
        <span className="rounded-full bg-[#E85A7E]/10 px-2 py-0.5 text-[10px] text-[#E85A7E]">系列赛 二元子市场</span>
      </div>
      <div className="mt-2 space-y-1.5">
        {group.yes && <BinarySideLeg position={group.yes} side="yes" priceFormat={priceFormat} onSell={onSell} />}
        {group.no && <BinarySideLeg position={group.no} side="no" priceFormat={priceFormat} onSell={onSell} />}
        {!group.yes && (
          <p className="rounded-md bg-[var(--bg-card)]/60 px-2 py-1 text-[10px] text-[var(--text-secondary)]">是 · 暂无持仓</p>
        )}
        {!group.no && (
          <p className="rounded-md bg-[var(--bg-card)]/60 px-2 py-1 text-[10px] text-[var(--text-secondary)]">否 · 暂无持仓</p>
        )}
      </div>
      <p className="mt-2 border-t border-[var(--border)]/50 pt-2 text-[10px] text-[var(--text-secondary)]">
        是与否分别可卖；不展示 YES − NO 净持仓；结算时一端兑付 1，一端兑付 0（void 除外）。
      </p>
    </article>
  )
}

function BinarySideLeg({
  position,
  side,
  priceFormat,
  onSell,
}: {
  position: SoccerAmmPosition
  side: 'yes' | 'no'
  priceFormat: 'probability' | 'european'
  onSell: (position: SoccerAmmPosition) => void
}) {
  const marketValue = position.shares * position.currentProbability
  const unrealized = position.shares * (position.currentProbability - position.avgPrice)
  const sideLabel = side === 'yes' ? '是 YES' : '否 NO'
  const sideTone = side === 'yes' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
  const badge = position.settlement ? settlementBadge[position.settlement] : undefined
  return (
    <div className="rounded-md bg-[var(--bg-card)]/60 p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sideTone}`}>{sideLabel}</span>
          {badge && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.tone}`}>{badge.label}</span>
          )}
        </div>
        <span className={`font-mono text-[10px] ${unrealized >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {unrealized >= 0 ? '+' : ''}{unrealized.toFixed(2)}
        </span>
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-2 text-[10px]">
        <Metric label="份额" value={position.shares.toFixed(2)} />
        <Metric label="均价" value={formatAmmPrice(position.avgPrice, priceFormat)} />
        <Metric label="退出参考" value={formatAmmPrice(position.currentProbability, priceFormat)} />
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[10px] text-[var(--text-secondary)]">市值 {marketValue.toFixed(2)} USDT · {formatImpliedProbability(position.currentProbability)}</span>
        {!badge && (
          <button onClick={() => onSell(position)} className="text-[10px] text-[#2DD4BF] hover:underline">
            卖出 {sideLabel}
          </button>
        )}
      </div>
    </div>
  )
}
