import { useMemo, useState } from 'react'
import {
  SOCCER_AMM_DUST_THRESHOLD_USDT,
  europeanOddsFromProbability,
  formatAmmPrice,
  formatImpliedProbability,
  formatProbability,
} from '../../data/soccer/ammData'
import { useSoccerAmmStore } from '../../stores/soccerAmmStore'
import { useWalletStore } from '../../stores/walletStore'

export default function AmmTradePanel() {
  const [amount, setAmount] = useState('50')
  const [sharesInput, setSharesInput] = useState('')
  const selectedOutcome = useSoccerAmmStore((state) => state.selectedOutcome)
  const side = useSoccerAmmStore((state) => state.side)
  const setSide = useSoccerAmmStore((state) => state.setSide)
  const quote = useSoccerAmmStore((state) => state.quote)
  const executeTrade = useSoccerAmmStore((state) => state.executeTrade)
  const positions = useSoccerAmmStore((state) => state.positions)
  const balance = useWalletStore((state) => state.balance)

  const position = selectedOutcome ? positions.find((item) => item.outcomeId === selectedOutcome.id) : undefined
  const numericAmount = Number(amount)
  const numericShares = Number(sharesInput)
  const quoteValue = side === 'buy' ? numericAmount : numericShares
  const quoteMode = side === 'buy' ? 'collateral' : 'shares'
  const currentQuote = useMemo(
    () => quote(quoteValue, quoteMode),
    [quote, quoteValue, quoteMode],
  )

  const sellAll = () => {
    if (!position) return
    setSharesInput(position.shares.toFixed(4))
  }

  const submit = () => {
    if (!currentQuote) return
    const ok = executeTrade(currentQuote)
    if (!ok) return
    if (side === 'buy') {
      setAmount('50')
    } else {
      setSharesInput('')
    }
  }

  if (!selectedOutcome) {
    return (
      <aside className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <p className="text-sm font-semibold text-[var(--text-primary)]">AMM 交易面板</p>
        <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
          选择任一 outcome 后，可按 AMM 即时报价买入预测份额；已有持仓可在这里部分卖出或全部卖出。
        </p>
        <div className="mt-3 rounded-lg bg-[var(--bg-control)] p-3 text-[10px] leading-5 text-[var(--text-secondary)]">
          平台只提供交易、结算和展示，不作为用户交易对手方。默认同时展示概率和份额价格，欧洲赔率仅为展示换算。
        </div>
      </aside>
    )
  }

  const maxLoss = currentQuote ? currentQuote.collateral + (side === 'buy' ? currentQuote.fee : 0) : 0
  const residualValue = position && currentQuote ? (position.shares - currentQuote.shares) * selectedOutcome.probability : 0
  const dustWarning = side === 'sell' && position && currentQuote && residualValue > 0 && residualValue < SOCCER_AMM_DUST_THRESHOLD_USDT

  return (
    <aside className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">AMM 交易面板</p>
          <p className="mt-1 text-[10px] text-[var(--text-secondary)]">Quote 有效 30 秒，成交按份额价格执行</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[var(--text-secondary)]">可用余额</p>
          <p className="text-xs font-mono text-[var(--text-primary)]">{balance.toFixed(2)} USDT</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-[var(--bg-control)] p-3">
        <p className="text-xs font-semibold text-[var(--text-primary)]">{selectedOutcome.marketTitle}</p>
        <p className="mt-1 text-sm text-[#2DD4BF]">{selectedOutcome.label}</p>
        <p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">{selectedOutcome.questionTitle}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {(['buy', 'sell'] as const).map((item) => (
          <button
            key={item}
            onClick={() => setSide(item)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              side === item
                ? 'bg-[#2DD4BF]/15 text-[#2DD4BF]'
                : 'bg-[var(--bg-control)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {item === 'buy' ? '买入份额' : '卖出份额'}
          </button>
        ))}
      </div>

      {side === 'buy' ? (
        <label className="mt-4 block">
          <span className="text-[10px] text-[var(--text-secondary)]">投入金额 USDT</span>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-control)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[#2DD4BF]/50"
          />
        </label>
      ) : (
        <label className="mt-4 block">
          <span className="flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
            <span>卖出份额</span>
            {position && (
              <button type="button" onClick={sellAll} className="text-[#2DD4BF] hover:underline">
                全部卖出 {position.shares.toFixed(2)}
              </button>
            )}
          </span>
          <input
            value={sharesInput}
            onChange={(event) => setSharesInput(event.target.value)}
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-control)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[#2DD4BF]/50"
            placeholder={position ? `最多 ${position.shares.toFixed(4)}` : '当前无可卖持仓'}
          />
        </label>
      )}

      <div className="mt-4 space-y-2 rounded-lg border border-[var(--border)] p-3 text-xs">
        <QuoteRow label="当前概率 / 份额价格" value={`${formatProbability(selectedOutcome.probability)} / Buy Yes ${formatAmmPrice(selectedOutcome.probability, 'probability')} / 欧赔 ${europeanOddsFromProbability(selectedOutcome.probability).toFixed(2)}`} />
        <QuoteRow label="预估成交均价" value={currentQuote ? `${formatImpliedProbability(currentQuote.avgPrice)} / ${formatAmmPrice(currentQuote.avgPrice, 'probability')} / 欧赔 ${europeanOddsFromProbability(currentQuote.avgPrice).toFixed(2)}` : '--'} />
        <QuoteRow label={side === 'buy' ? '预估获得份额' : '预计收回金额'} value={currentQuote ? (side === 'buy' ? `${currentQuote.shares.toFixed(4)} 份` : `${Math.max(0, currentQuote.collateral - currentQuote.fee).toFixed(2)} USDT`) : '--'} />
        <QuoteRow label="价格影响" value={currentQuote ? formatProbability(currentQuote.priceImpact) : '--'} warning={!!currentQuote && currentQuote.priceImpact > 0.05} />
        <QuoteRow label="手续费" value={currentQuote ? `${currentQuote.fee.toFixed(2)} USDT` : '--'} />
        {side === 'buy' && <QuoteRow label="最大亏损" value={currentQuote ? `${maxLoss.toFixed(2)} USDT` : '--'} />}
        {side === 'sell' && position && currentQuote && (
          <QuoteRow label="本次已实现盈亏" value={`${((currentQuote.avgPrice - position.avgPrice) * currentQuote.shares - currentQuote.fee).toFixed(2)} USDT`} />
        )}
        {side === 'sell' && position && currentQuote && (
          <QuoteRow label="卖出后剩余" value={`${Math.max(0, position.shares - currentQuote.shares).toFixed(4)} 份`} />
        )}
      </div>

      {dustWarning && (
        <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-[10px] leading-5 text-amber-300">
          卖出后剩余持仓价值低于 {SOCCER_AMM_DUST_THRESHOLD_USDT} USDT，建议改为全部卖出。
        </p>
      )}

      <button
        onClick={submit}
        disabled={!currentQuote}
        className="mt-4 w-full rounded-lg bg-[#2DD4BF] px-4 py-2.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        {side === 'buy' ? '确认买入' : '确认卖出'}
      </button>

      <p className="mt-3 text-[10px] leading-5 text-[var(--text-secondary)]">
        结算规则：正确 outcome 每份兑付 1 USDT，错误 outcome 兑付 0；void 按规则退款。
      </p>
    </aside>
  )
}

function QuoteRow({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className={`font-mono tabular-nums ${warning ? 'text-amber-300' : 'text-[var(--text-primary)]'}`}>{value}</span>
    </div>
  )
}
