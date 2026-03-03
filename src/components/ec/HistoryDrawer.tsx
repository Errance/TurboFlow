import { useEventContractStore } from '../../stores/eventContractStore'
import type { ECBet } from '../../types/eventContract'

function HistoryRow({ bet }: { bet: ECBet }) {
  const won = bet.status === 'won'
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
      <div className="flex items-center gap-2">
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            bet.direction === 'higher'
              ? 'bg-[#2DD4BF]/15 text-[#2DD4BF]'
              : 'bg-[#F87171]/15 text-[#F87171]'
          }`}
        >
          {bet.direction === 'higher' ? 'H' : 'L'}
        </span>
        <div>
          <div className="text-xs font-medium text-[var(--text-primary)]">
            {bet.asset}/USDT · {bet.duration < 60 ? `${bet.duration}s` : `${bet.duration / 60}min`}
          </div>
          <div className="text-[10px] text-[var(--text-tertiary)]">
            {new Date(bet.createdAt).toLocaleTimeString()}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div
          className={`text-xs font-bold tabular-nums ${
            won ? 'text-[#2DD4BF]' : 'text-[#F87171]'
          }`}
        >
          {won ? '+' : ''}{bet.pnl?.toFixed(2) ?? '0.00'}
        </div>
        <div className="text-[10px] text-[var(--text-tertiary)]">${bet.amount} bet</div>
      </div>
    </div>
  )
}

export default function HistoryDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const settledBets = useEventContractStore((s) => s.settledBets)

  const totalPnl = settledBets.reduce((sum, b) => sum + (b.pnl ?? 0), 0)
  const wins = settledBets.filter((b) => b.status === 'won').length
  const losses = settledBets.filter((b) => b.status === 'lost').length
  const winRate = settledBets.length > 0 ? ((wins / settledBets.length) * 100).toFixed(0) : '—'

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg max-h-[80vh] bg-[var(--bg-card)] border border-[var(--border)] rounded-t-2xl md:rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold">History</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--border)] text-[var(--text-secondary)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 px-4 py-3 border-b border-[var(--border)]">
          <div className="text-center">
            <div className="text-[10px] text-[var(--text-tertiary)]">Total P&L</div>
            <div
              className={`text-sm font-bold tabular-nums ${
                totalPnl >= 0 ? 'text-[#2DD4BF]' : 'text-[#F87171]'
              }`}
            >
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-[var(--text-tertiary)]">Win Rate</div>
            <div className="text-sm font-bold text-[var(--text-primary)]">{winRate}%</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-[var(--text-tertiary)]">W / L</div>
            <div className="text-sm font-bold text-[var(--text-primary)]">
              <span className="text-[#2DD4BF]">{wins}</span>
              {' / '}
              <span className="text-[#F87171]">{losses}</span>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4">
          {settledBets.length === 0 ? (
            <div className="text-center py-10 text-sm text-[var(--text-tertiary)]">
              No settled bets yet
            </div>
          ) : (
            settledBets.map((bet) => <HistoryRow key={bet.id} bet={bet} />)
          )}
        </div>
      </div>
    </div>
  )
}
