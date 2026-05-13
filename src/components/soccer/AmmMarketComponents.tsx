import { useMemo, useState } from 'react'
import {
  ammPositions,
  decimalOdds,
  estimateAmmQuote,
  formatPrice,
  formatSignedPercent,
  getAmmMarketById,
  getOutcome,
  getPositionFor,
  type AmmMarket,
  type AmmOutcome,
  type AmmPosition,
  type PriceFormat,
  type TradeSide,
} from '../../data/soccer/ammMarkets'

const QUICK_TRADE_AMOUNTS = [50, 100, 200, 500]
const DEMO_MAX_TRADE_AMOUNT = 1000

export function PriceFormatToggle({
  value,
  onChange,
}: {
  value: PriceFormat
  onChange: (value: PriceFormat) => void
}) {
  return (
    <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1">
      {[
        ['probability', '份额价格'],
        ['decimal', '欧洲赔率'],
      ].map(([id, label]) => (
        <button
          key={id}
          onClick={() => onChange(id as PriceFormat)}
          className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
            value === id
              ? 'bg-[#2DD4BF]/15 text-[#2DD4BF] font-semibold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function AmmStatusBadge({ market }: { market: AmmMarket }) {
  const config = {
    open: ['可交易', 'bg-[#2DD4BF]/10 text-[#2DD4BF]'],
    paused: ['暂停交易', 'bg-[#F59E0B]/10 text-[#F59E0B]'],
    view_only: ['只可查看', 'bg-[var(--bg-control)] text-[var(--text-secondary)]'],
    official_pending: ['等待官方结果', 'bg-[#8B5CF6]/10 text-[#A78BFA]'],
    settled: ['已结算', 'bg-[#10B981]/10 text-[#10B981]'],
    void: ['已作废', 'bg-[#E85A7E]/10 text-[#E85A7E]'],
  } satisfies Record<AmmMarket['status'], [string, string]>

  const [label, className] = config[market.status]
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${className}`}>{label}</span>
}

export function AmmMarketCard({
  market,
  priceFormat,
  selectedOutcomeId,
  onSelect,
  onOpen,
}: {
  market: AmmMarket
  priceFormat: PriceFormat
  selectedOutcomeId?: string
  onSelect?: (market: AmmMarket, outcome: AmmOutcome) => void
  onOpen?: (market: AmmMarket) => void
}) {
  const topOutcome = market.outcomes[0]

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--bg-control)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">{market.group}</span>
            <AmmStatusBadge market={market} />
          </div>
          <h3 className="mt-2 text-base font-semibold text-[var(--text-primary)]">{market.questionTitle}</h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{market.eventLabel}</p>
        </div>
        <button
          onClick={() => onOpen?.(market)}
          className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:border-[#2DD4BF]/50 hover:text-[#2DD4BF]"
        >
          详情
        </button>
      </div>

      <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">{market.description}</p>

      <div className="mt-4 grid gap-2">
        {market.outcomes.map((outcome) => {
          const selected = selectedOutcomeId === outcome.id
          const disabled = market.status !== 'open'
          return (
            <button
              key={outcome.id}
              disabled={disabled}
              onClick={() => onSelect?.(market, outcome)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                selected
                  ? 'border-[#2DD4BF] bg-[#2DD4BF]/10'
                  : 'border-[var(--border)] bg-[var(--bg-control)]/30 hover:border-[#2DD4BF]/40'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[var(--text-primary)]">{outcome.label}</span>
                <span className="font-mono text-sm font-semibold text-[#2DD4BF]">{formatPrice(outcome.price, priceFormat)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
                <span>欧洲赔率 {decimalOdds(outcome.price).toFixed(2)}</span>
                <span className={outcome.priceChange24h >= 0 ? 'text-[#10B981]' : 'text-[#E85A7E]'}>
                  24h {formatSignedPercent(outcome.priceChange24h)}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] text-[var(--text-secondary)]">
        <Metric label="流动性" value={`${(market.liquidity / 1000).toFixed(0)}k`} />
        <Metric label="24h 成交" value={`${(market.volume24h / 1000).toFixed(1)}k`} />
        <Metric label="主价格" value={formatPrice(topOutcome.price, priceFormat)} />
      </div>
    </section>
  )
}

export function AmmTradePanel({
  market,
  outcome,
  priceFormat,
}: {
  market?: AmmMarket
  outcome?: AmmOutcome
  priceFormat: PriceFormat
}) {
  const [side, setSide] = useState<TradeSide>('buy')
  const [amount, setAmount] = useState('100')
  const position = market && outcome ? getPositionFor(market.id, outcome.id) : undefined
  const numeric = Math.max(Number(amount) || 0, 0)
  const quote = useMemo(() => {
    if (!market || !outcome) return undefined
    return estimateAmmQuote(market, outcome, side, numeric, side === 'buy' ? 'collateral' : 'shares')
  }, [market, numeric, outcome, side])

  if (!market || !outcome) {
    return (
      <aside className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">交易面板</h2>
        <p className="mt-3 text-xs text-[var(--text-secondary)]">选择一个 outcome 后查看 RFQ 做市商报价。</p>
      </aside>
    )
  }

  const tradingDisabled = market.status !== 'open' || market.providerStatus !== 'quoting'
  const sellDisabled = side === 'sell' && !position

  return (
    <aside className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">交易面板</h2>
          <p className="mt-1 text-[10px] text-[var(--text-secondary)]">RFQ 做市商报价，确认后锁定本次成交价。</p>
        </div>
        <AmmStatusBadge market={market} />
      </div>

      <div className="mt-4 rounded-xl bg-[var(--bg-control)]/50 p-3">
        <p className="text-[10px] text-[var(--text-secondary)]">已选 outcome</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-[var(--text-primary)]">{outcome.label}</p>
          <p className="font-mono text-sm font-semibold text-[#2DD4BF]">{formatPrice(outcome.price, priceFormat)}</p>
        </div>
        <p className="mt-1 text-[10px] text-[var(--text-secondary)]">概率 {Math.round(outcome.price * 100)}% · 欧洲赔率 {decimalOdds(outcome.price).toFixed(2)}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          ['buy', '买入'],
          ['sell', '卖出'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSide(id as TradeSide)}
            className={`rounded-xl px-3 py-2 text-sm transition-colors ${
              side === id
                ? 'bg-[#2DD4BF]/15 text-[#2DD4BF] font-semibold'
                : 'bg-[var(--bg-control)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {side === 'sell' && (
        <div className="mt-3 rounded-xl border border-[var(--border)] p-3 text-xs">
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span>可卖 shares</span>
            <span className="font-mono text-[var(--text-primary)]">{position ? position.shares.toFixed(2) : '0.00'}</span>
          </div>
          {position && (
            <button onClick={() => setAmount(String(position.shares))} className="mt-2 text-[10px] text-[#2DD4BF]">
              全部卖出
            </button>
          )}
        </div>
      )}

      <label className="mt-4 block">
        <span className="text-[10px] text-[var(--text-secondary)]">{side === 'buy' ? '交易金额 USDT' : '卖出 shares'}</span>
        <div className="relative mt-1">
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-control)] px-3 py-2 pr-14 font-mono text-sm text-[var(--text-primary)] outline-none focus:border-[#2DD4BF]"
          />
          <button type="button" onClick={() => setAmount(side === 'sell' && position ? String(position.shares) : String(DEMO_MAX_TRADE_AMOUNT))} className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#2DD4BF] hover:text-[#5EEAD4]">
            Max
          </button>
        </div>
        {side === 'buy' && (
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {QUICK_TRADE_AMOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(String(value))}
                className="rounded-md bg-[var(--bg-control)] px-2 py-1.5 text-[10px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--border)] hover:text-[var(--text-primary)]"
              >
                {value}
              </button>
            ))}
          </div>
        )}
      </label>

      {quote && (
        <div className="mt-4 space-y-2 rounded-xl bg-[var(--bg-control)]/50 p-3 text-xs">
          <QuoteRow label={side === 'buy' ? '预计获得 shares' : '卖出 shares'} value={quote.shares.toFixed(2)} />
          <QuoteRow label="预估成交均价" value={`${Math.round(quote.avgPrice * 100)}% / ${decimalOdds(quote.avgPrice).toFixed(2)}`} />
          <QuoteRow label={side === 'buy' ? '预计支付' : '预计收回'} value={`${quote.collateral.toFixed(2)} USDT`} />
          <QuoteRow label="做市商报价偏移" value={`${quote.priceImpact.toFixed(2)}%`} warning={quote.priceImpact > 4} />
          <QuoteRow label="手续费" value={`${quote.fee.toFixed(2)} USDT`} />
          <QuoteRow label="交易后价格" value={`${Math.round(quote.nextPrice * 100)}%`} />
        </div>
      )}

      {tradingDisabled && (
        <p className="mt-3 rounded-xl bg-[#F59E0B]/10 p-3 text-xs text-[#F59E0B]">
          当前市场暂停交易或外部流动性未报价，恢复前需要重新询价。
        </p>
      )}
      {sellDisabled && (
        <p className="mt-3 rounded-xl bg-[#E85A7E]/10 p-3 text-xs text-[#E85A7E]">你当前没有该 outcome 的可卖持仓。</p>
      )}

      <button
        disabled={tradingDisabled || sellDisabled}
        className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
          tradingDisabled || sellDisabled
            ? 'cursor-not-allowed bg-[var(--bg-control)] text-[var(--text-secondary)]'
            : 'bg-[#2DD4BF] text-[#06201D] hover:bg-[#5EEAD4]'
        }`}
      >
        {side === 'buy' ? '确认买入预测份额' : '确认卖出预测份额'}
      </button>

      <p className="mt-3 text-[10px] leading-4 text-[var(--text-secondary)]">
        Quote 有效期 {market.quoteTtlSeconds} 秒；成交失败可能由做市商拒单、价格保护或关键事件暂停触发。
      </p>
    </aside>
  )
}

export function AmmPortfolioPanel({ compact = false }: { compact?: boolean }) {
  const rows = ammPositions.map((position) => {
    const market = getAmmMarketById(position.marketId)
    const outcome = market ? getOutcome(market, position.outcomeId) : undefined
    const currentValue = outcome ? position.shares * outcome.price : 0
    const cost = position.shares * position.avgPrice
    return { position, market, outcome, currentValue, pnl: currentValue - cost + position.realizedPnl }
  })

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Portfolio</h2>
          <p className="mt-1 text-[10px] text-[var(--text-secondary)]">持仓、可卖份额、均价和盈亏。</p>
        </div>
        <span className="rounded-full bg-[#2DD4BF]/10 px-2.5 py-1 text-[10px] text-[#2DD4BF]">{rows.length} 个持仓</span>
      </div>

      <div className="mt-4 space-y-3">
        {rows.slice(0, compact ? 3 : rows.length).map(({ position, market, outcome, currentValue, pnl }) => (
          <PortfolioRow
            key={position.id}
            position={position}
            marketTitle={market?.questionTitle ?? position.marketId}
            outcomeLabel={outcome?.label ?? position.outcomeId}
            currentPrice={outcome?.price ?? position.avgPrice}
            currentValue={currentValue}
            pnl={pnl}
          />
        ))}
      </div>
    </section>
  )
}

function PortfolioRow({
  position,
  marketTitle,
  outcomeLabel,
  currentPrice,
  currentValue,
  pnl,
}: {
  position: AmmPosition
  marketTitle: string
  outcomeLabel: string
  currentPrice: number
  currentValue: number
  pnl: number
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-control)]/30 p-3">
      <p className="line-clamp-1 text-xs font-medium text-[var(--text-primary)]">{marketTitle}</p>
      <p className="mt-1 text-[10px] text-[var(--text-secondary)]">{outcomeLabel}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-[var(--text-secondary)]">
        <Metric label="shares" value={position.shares.toFixed(2)} />
        <Metric label="均价" value={`${Math.round(position.avgPrice * 100)}%`} />
        <Metric label="当前价" value={`${Math.round(currentPrice * 100)}%`} />
        <Metric label="市值" value={`${currentValue.toFixed(2)} USDT`} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px]">
        <span className="text-[var(--text-secondary)]">总盈亏</span>
        <span className={`font-mono ${pnl >= 0 ? 'text-[#10B981]' : 'text-[#E85A7E]'}`}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} USDT</span>
      </div>
    </div>
  )
}

function QuoteRow({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className={`font-mono ${warning ? 'text-[#F59E0B]' : 'text-[var(--text-primary)]'}`}>{value}</span>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--bg-control)] px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-wide text-[var(--text-secondary)]">{label}</p>
      <p className="mt-0.5 font-mono text-[10px] text-[var(--text-primary)]">{value}</p>
    </div>
  )
}
