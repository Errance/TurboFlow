import { useState } from 'react'
import type { BetSlipItem } from '../../data/soccer/types'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface Props {
  items: BetSlipItem[]
  onRemove: (id: string) => void
  onClear: () => void
}

export default function SoccerBetSlip({ items, onRemove, onClear }: Props) {
  const [amount, setAmount] = useState('')
  const totalOdds = items.reduce((acc, item) => acc * item.odds, 1)
  const payout = amount ? (parseFloat(amount) * totalOdds).toFixed(2) : '0.00'

  if (items.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">投注单</h3>
        <p className="text-xs text-[var(--text-secondary)] text-center py-6">
          点击赔率按钮添加选项
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          投注单
          <span className="ml-1.5 text-[10px] bg-[#2DD4BF] text-[#0B0B0F] px-1.5 py-0.5 rounded-full font-bold">
            {items.length}
          </span>
        </h3>
        <button onClick={onClear} className="text-xs text-[var(--text-secondary)] hover:text-[#E85A7E] transition-colors">
          清空
        </button>
      </div>

      <div className="space-y-2 mb-4">
        {items.map((item) => (
          <div key={item.id} className="bg-[var(--bg-control)] rounded-lg p-3 relative group">
            <button
              onClick={() => onRemove(item.id)}
              className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--border)] text-[var(--text-secondary)] hover:bg-[#E85A7E] hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-xs"
            >
              ×
            </button>
            <p className="text-[10px] text-[var(--text-secondary)] mb-0.5 truncate pr-6">{item.matchLabel}</p>
            <p className="text-xs text-[var(--text-primary)] mb-0.5">{item.marketTitle}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#2DD4BF]">{item.selection}</span>
              <span className="text-sm font-bold font-mono text-[var(--text-primary)]">{item.odds.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-3 pb-3 border-b border-[var(--border)]">
          <span>组合赔率</span>
          <span className="font-mono font-semibold text-[var(--text-primary)]">{totalOdds.toFixed(2)}</span>
        </div>
      )}

      <Input
        label="投注金额"
        type="number"
        placeholder="0.00"
        suffix="USDT"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="mb-3"
      />

      <div className="flex items-center justify-between text-xs mb-4">
        <span className="text-[var(--text-secondary)]">预计收益</span>
        <span className="font-mono font-semibold text-[#2DD4BF]">{payout} USDT</span>
      </div>

      <Button fullWidth disabled={!amount || parseFloat(amount) <= 0}>
        确认投注
      </Button>
    </div>
  )
}
