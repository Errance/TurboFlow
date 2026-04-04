import type { MyBetItem } from '../../data/soccer/types'
import Badge from '../ui/Badge'

interface Props {
  bets: MyBetItem[]
}

const resultConfig = {
  win: { label: '赢', variant: 'success' as const, sign: '+' },
  loss: { label: '输', variant: 'danger' as const, sign: '-' },
  push: { label: '退款', variant: 'neutral' as const, sign: '' },
}

export default function MyBetsPanel({ bets }: Props) {
  if (bets.length === 0) return null

  const totalProfit = bets.reduce((sum, b) => sum + b.payout - b.amount, 0)

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          我的投注
          <span className="ml-1.5 text-[10px] bg-[var(--border)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded-full font-bold">
            {bets.length}
          </span>
        </h3>
        <span className={`text-xs font-mono font-semibold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)} USDT
        </span>
      </div>

      <div className="space-y-2">
        {bets.map((bet) => {
          const cfg = resultConfig[bet.result]
          const profitAmount = bet.payout - bet.amount
          return (
            <div key={bet.id} className="bg-[var(--bg-control)] rounded-lg p-3">
              <div className="flex items-start justify-between mb-1">
                <p className="text-[10px] text-[var(--text-secondary)] truncate flex-1 mr-2">{bet.matchLabel}</p>
                <Badge variant={cfg.variant}>{cfg.label}</Badge>
              </div>
              <p className="text-xs text-[var(--text-primary)] mb-0.5">{bet.marketTitle}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#2DD4BF]">{bet.selection}</span>
                <span className="text-xs font-mono text-[var(--text-secondary)]">@{bet.odds.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-[var(--border)]/50">
                <span className="text-[10px] text-[var(--text-secondary)]">
                  投注 {bet.amount.toFixed(2)} USDT
                </span>
                <span className={`text-xs font-mono font-semibold ${
                  bet.result === 'win' ? 'text-emerald-400' :
                  bet.result === 'loss' ? 'text-red-400' :
                  'text-[var(--text-secondary)]'
                }`}>
                  {bet.result === 'win' && `${cfg.sign}${profitAmount.toFixed(2)}`}
                  {bet.result === 'loss' && `${cfg.sign}${bet.amount.toFixed(2)}`}
                  {bet.result === 'push' && `退还 ${bet.amount.toFixed(2)}`}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
