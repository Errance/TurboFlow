import { useMemo, useState } from 'react'
import {
  SOCCER_AMM_DUST_THRESHOLD_USDT,
  europeanOddsFromProbability,
  enumerateAmmMarketOutcomes,
  formatAmmPrice,
  formatImpliedProbability,
  formatProbability,
  formatSharePrice,
  subjectFromBetSubject,
} from '../../data/soccer/ammData'
import { futureMarkets } from '../../data/soccer/futuresData'
import { useSoccerAmmStore } from '../../stores/soccerAmmStore'
import { useWalletStore } from '../../stores/walletStore'

const QUICK_TRADE_AMOUNTS = [50, 100, 200, 500]

export default function AmmTradePanel() {
  const [amount, setAmount] = useState('50')
  const [sharesInput, setSharesInput] = useState('')
  const selectedOutcome = useSoccerAmmStore((state) => state.selectedOutcome)
  const side = useSoccerAmmStore((state) => state.side)
  const setSide = useSoccerAmmStore((state) => state.setSide)
  const quote = useSoccerAmmStore((state) => state.quote)
  const selectOutcome = useSoccerAmmStore((state) => state.selectOutcome)
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
  const counterpartOutcome = useMemo(() => {
    if (!selectedOutcome?.binarySide || !selectedOutcome.candidate) return undefined
    const marketItem = futureMarkets.find((item) => (
      item.subject.subjectId === selectedOutcome.subject.id &&
      item.market.title === selectedOutcome.marketTitle
    ))
    if (!marketItem) return undefined
    const outcomes = enumerateAmmMarketOutcomes(
      marketItem.market,
      subjectFromBetSubject(marketItem.subject),
    )
    return outcomes.find((outcome) => (
      outcome.candidate === selectedOutcome.candidate &&
      outcome.binarySide &&
      outcome.binarySide !== selectedOutcome.binarySide
    ))
  }, [selectedOutcome])
  const binaryOutcomeLabel = selectedOutcome?.binarySide === 'no' ? 'No' : 'Yes'

  const sellAll = () => {
    if (!position) return
    setSharesInput(position.shares.toFixed(4))
  }

  const buyMax = () => {
    setAmount(Math.max(0, balance).toFixed(2))
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

  const switchBinarySide = () => {
    if (!counterpartOutcome) return
    selectOutcome(counterpartOutcome, 'buy')
    setSharesInput('')
  }

  if (!selectedOutcome) {
    return (
      <aside className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <p className="text-sm font-semibold text-[var(--text-primary)]">交易面板</p>
        <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
          选择任一 outcome 后，可获取最新报价并买入预测份额；已有持仓可获取退出报价后部分卖出或全部卖出。
        </p>
        <div className="mt-3 rounded-lg bg-[var(--bg-control)] p-3 text-[10px] leading-5 text-[var(--text-secondary)]">
          页面默认同时展示概率和份额价格，欧洲赔率仅为展示换算；成交以短时有效的最新报价为准。
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
          <p className="text-sm font-semibold text-[var(--text-primary)]">交易面板</p>
          <p className="mt-1 text-[10px] text-[var(--text-secondary)]">报价有效 30 秒，确认后锁定本次成交价</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[var(--text-secondary)]">可用余额</p>
          <p className="text-xs font-mono text-[var(--text-primary)]">{balance.toFixed(2)} USDT</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-[var(--bg-control)] p-3">
        <p className="text-xs font-semibold text-[var(--text-primary)]">{selectedOutcome.marketTitle}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-sm text-[#2DD4BF]">{selectedOutcome.label}</p>
          {selectedOutcome.binarySide && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              selectedOutcome.binarySide === 'yes'
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'bg-rose-500/15 text-rose-300'
            }`}>
              系列赛 · {selectedOutcome.binarySide === 'yes' ? '是 YES' : '否 NO'} 腿
            </span>
          )}
          {selectedOutcome.isReferencePrice && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">参考价（成交以最新报价为准）</span>
          )}
        </div>
        <p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">{selectedOutcome.questionTitle}</p>
        {selectedOutcome.binarySide && (
          <p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">
            是与否各自一次询价、一次确认；切换 side、修改候选或金额都会让旧报价失效。买「{selectedOutcome.label.replace(/\s*(是|否)\s*$/, '').trim()} 否」≠ 买其他候选的「是」，盈亏结构不同。
          </p>
        )}
        {selectedOutcome.binarySide && counterpartOutcome && (
          <button
            type="button"
            onClick={switchBinarySide}
            className="mt-2 rounded-md bg-[var(--bg-card)] px-2 py-1 text-[10px] font-semibold text-[#2DD4BF] hover:text-[#5EEAD4]"
          >
            切换到同候选 {counterpartOutcome.binarySide === 'yes' ? 'YES 是' : 'NO 否'}
          </button>
        )}
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
          <div className="relative mt-1">
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-control)] px-3 py-2 pr-14 text-sm text-[var(--text-primary)] outline-none focus:border-[#2DD4BF]/50"
            />
            <button type="button" onClick={buyMax} className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#2DD4BF] hover:text-[#5EEAD4]">
              Max
            </button>
          </div>
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
          <div className="relative mt-1">
            <input
              value={sharesInput}
              onChange={(event) => setSharesInput(event.target.value)}
              inputMode="decimal"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-control)] px-3 py-2 pr-14 text-sm text-[var(--text-primary)] outline-none focus:border-[#2DD4BF]/50"
              placeholder={position ? `最多 ${position.shares.toFixed(4)}` : '当前无可卖持仓'}
            />
            <button type="button" onClick={sellAll} disabled={!position} className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#2DD4BF] hover:text-[#5EEAD4] disabled:opacity-40">
              Max
            </button>
          </div>
        </label>
      )}

      <div className="mt-4 space-y-2 rounded-lg border border-[var(--border)] p-3 text-xs">
        <QuoteRow label="当前概率 / 份额价格" value={`${formatProbability(selectedOutcome.probability)} / Buy ${binaryOutcomeLabel} ${formatSharePrice(selectedOutcome.probability)} / 欧赔 ${europeanOddsFromProbability(selectedOutcome.probability).toFixed(2)}`} />
        <QuoteRow label={side === 'buy' ? '买入报价' : '退出报价'} value={currentQuote ? `${formatImpliedProbability(currentQuote.avgPrice)} / ${formatAmmPrice(currentQuote.avgPrice, 'probability')} / 欧赔 ${europeanOddsFromProbability(currentQuote.avgPrice).toFixed(2)}` : '--'} />
        <QuoteRow label={side === 'buy' ? '预估获得份额' : '预计收回金额'} value={currentQuote ? (side === 'buy' ? `${currentQuote.shares.toFixed(4)} 份` : `${Math.max(0, currentQuote.collateral - currentQuote.fee).toFixed(2)} USDT`) : '--'} />
        <QuoteRow label="报价变化" value={currentQuote ? formatProbability(currentQuote.providerSpread) : '--'} warning={!!currentQuote && currentQuote.providerSpread > 0.05} />
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
        结算规则：正确 outcome 每份兑付 1 USDT，错误 outcome 兑付 0；买入成交赔率锁定，卖出需重新请求退出报价。
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
