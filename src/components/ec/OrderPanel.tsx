import { useState, useMemo } from 'react'
import { useEventContractStore } from '../../stores/eventContractStore'
import { EC_TIME_OPTIONS, EC_MIN_BET, EC_MAX_BET, type ECTimeIncrement } from '../../types/eventContract'
import { useToastStore } from '../../stores/toastStore'

const CHIPS = [5, 10, 20, 50, 100]

export default function OrderPanel() {
  const balance = useEventContractStore((s) => s.balance)
  const currentDuration = useEventContractStore((s) => s.currentDuration)
  const setDuration = useEventContractStore((s) => s.setDuration)
  const placeBet = useEventContractStore((s) => s.placeBet)
  const getCurrentOdds = useEventContractStore((s) => s.getCurrentOdds)
  const addToast = useToastStore((s) => s.addToast)

  const [amount, setAmount] = useState(10)

  const odds = useMemo(() => getCurrentOdds(), [getCurrentOdds, currentDuration])

  const higherProfit = amount * odds.higher
  const lowerProfit = amount * odds.lower

  function handleBet(direction: 'higher' | 'lower') {
    if (amount < EC_MIN_BET) {
      addToast({ type: 'error', message: `最低投注金额为 ${EC_MIN_BET} USDT` })
      return
    }
    if (amount > balance) {
      addToast({ type: 'error', message: '余额不足，请调整金额' })
      return
    }
    const bet = placeBet(direction, amount)
    if (bet) {
      addToast({
        type: 'success',
        message: `已提交${direction === 'higher' ? '看涨' : '看跌'}投注，金额 ${amount} USDT`,
      })
    }
  }

  function handleAmountChange(val: string) {
    const n = Number(val)
    if (isNaN(n)) return
    setAmount(Math.min(n, EC_MAX_BET))
  }

  return (
    <section className="mb-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
      {/* Balance */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[var(--text-tertiary)]">可用余额</span>
        <span className="text-sm font-semibold tabular-nums">
          ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Time Increment */}
      <div className="flex gap-1 mb-3 p-0.5 bg-[var(--bg-base)] rounded-lg">
        {EC_TIME_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setDuration(opt.value as ECTimeIncrement)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
              currentDuration === opt.value
                ? 'bg-[var(--bg-card)] text-[#2DD4BF] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Amount Input */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[var(--text-tertiary)]">投注金额</span>
          <span className="text-xs text-[var(--text-tertiary)]">${EC_MIN_BET} – ${EC_MAX_BET} USDT</span>
        </div>
        <div className="flex items-center gap-2 bg-[var(--bg-base)] rounded-lg border border-[var(--border)] px-3 py-2">
          <span className="text-sm text-[var(--text-tertiary)]">$</span>
          <input
            type="number"
            value={amount || ''}
            onChange={(e) => handleAmountChange(e.target.value)}
            min={EC_MIN_BET}
            max={EC_MAX_BET}
            className="flex-1 bg-transparent text-sm font-semibold tabular-nums outline-none text-[var(--text-primary)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            onClick={() => setAmount(Math.min(balance, EC_MAX_BET))}
            className="text-[10px] font-semibold text-[#2DD4BF] hover:text-[#2DD4BF]/80 transition-colors"
          >
            最大
          </button>
        </div>
        {/* Chips */}
        <div className="flex gap-1.5 mt-2">
          {CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => setAmount(c)}
              className={`flex-1 py-1 text-[11px] font-medium rounded-md transition-all duration-100 ${
                amount === c
                  ? 'bg-[#2DD4BF]/15 text-[#2DD4BF] border border-[#2DD4BF]/30'
                  : 'bg-[var(--bg-base)] text-[var(--text-secondary)] border border-transparent hover:border-[var(--border)]'
              }`}
            >
              ${c}
            </button>
          ))}
        </div>
      </div>

      {/* Payout info */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="text-center">
          <div className="text-[10px] text-[var(--text-tertiary)] mb-0.5">看涨收益</div>
          <div className="text-sm font-bold text-[#2DD4BF] tabular-nums">
            +${higherProfit.toFixed(2)}
          </div>
          <div className="text-[10px] text-[var(--text-tertiary)]">
            回报率 {(odds.higher * 100).toFixed(0)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[var(--text-tertiary)] mb-0.5">看跌收益</div>
          <div className="text-sm font-bold text-[#F87171] tabular-nums">
            +${lowerProfit.toFixed(2)}
          </div>
          <div className="text-[10px] text-[var(--text-tertiary)]">
            回报率 {(odds.lower * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Loss disclaimer */}
      <div className="text-center text-[10px] text-[var(--text-tertiary)] mb-3">
        判断错误将损失：-{amount.toFixed(2)} USDT
      </div>

      {/* CTA buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleBet('higher')}
          disabled={amount < EC_MIN_BET || amount > balance}
          className="py-3 rounded-xl text-sm font-bold bg-[#2DD4BF] text-[#0B0B0F] hover:bg-[#2DD4BF]/90 active:scale-[0.97] transition-all duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          看涨
        </button>
        <button
          onClick={() => handleBet('lower')}
          disabled={amount < EC_MIN_BET || amount > balance}
          className="py-3 rounded-xl text-sm font-bold bg-[#F87171] text-white hover:bg-[#F87171]/90 active:scale-[0.97] transition-all duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          看跌
        </button>
      </div>
    </section>
  )
}
