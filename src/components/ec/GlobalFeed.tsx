import { useEventContractStore } from '../../stores/eventContractStore'
import type { ECGlobalBet } from '../../types/eventContract'

function FeedRow({ bet }: { bet: ECGlobalBet }) {
  const isHigher = bet.direction === 'higher'
  const isSettled = bet.status === 'won' || bet.status === 'lost'
  const won = bet.status === 'won'

  return (
    <div
      className="flex items-center justify-between py-2 px-3 border-b border-[var(--border)] last:border-0 animate-[slideIn_0.3s_ease-out]"
      style={{ animationFillMode: 'backwards' }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-full bg-[var(--bg-base)] flex items-center justify-center text-[10px] font-bold text-[var(--text-secondary)] shrink-0">
          {bet.playerName.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[120px]">
            {bet.playerName}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
            <span>{bet.asset}/USDT</span>
            <span
              className={`font-bold ${
                isHigher ? 'text-[#2DD4BF]' : 'text-[#F87171]'
              }`}
            >
              {isHigher ? 'H' : 'L'}
            </span>
          </div>
        </div>
      </div>

      <div className="text-right shrink-0">
        {isSettled ? (
          <div
            className={`text-xs font-bold tabular-nums ${
              won ? 'text-[#2DD4BF]' : 'text-[#F87171]'
            }`}
          >
            {won ? '+' : ''}{bet.pnl?.toFixed(2)}
          </div>
        ) : (
          <div className="text-xs font-medium text-[var(--text-secondary)] tabular-nums">
            ${bet.amount}
          </div>
        )}
        <div className="text-[10px] text-[var(--text-tertiary)]">
          {isSettled ? (
            <span className={won ? 'text-[#2DD4BF]/70' : 'text-[#F87171]/70'}>
              {won ? 'Won' : 'Lost'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] animate-pulse" />
              Active
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GlobalFeed() {
  const globalFeed = useEventContractStore((s) => s.globalFeed)

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {globalFeed.length === 0 ? (
        <div className="text-center py-10 text-sm text-[var(--text-tertiary)]">
          <div className="text-2xl mb-2">👥</div>
          Waiting for players...
        </div>
      ) : (
        <div className="max-h-[400px] overflow-y-auto">
          {globalFeed.map((bet) => (
            <FeedRow key={bet.id} bet={bet} />
          ))}
        </div>
      )}
    </>
  )
}
