import { useState, useEffect } from 'react'
import { useEventContractStore } from '../../stores/eventContractStore'
import type { ECBet } from '../../types/eventContract'
import { EC_ASSET_DECIMALS } from '../../types/eventContract'

export default function PositionCard({ bet }: { bet: ECBet }) {
  const currentPrices = useEventContractStore((s) => s.currentPrices)
  const getEstimatedPnl = useEventContractStore((s) => s.getEstimatedPnl)
  const [timeLeft, setTimeLeft] = useState(Math.max(0, bet.endsAt - Date.now()))

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(Math.max(0, bet.endsAt - Date.now()))
    }, 100)
    return () => clearInterval(id)
  }, [bet.endsAt])

  const currentPrice = currentPrices[bet.asset]
  const estimatedPnl = getEstimatedPnl(bet.id)
  const isWinning = estimatedPnl > 0
  const urgent = timeLeft <= 5000 && timeLeft > 0
  const settling = timeLeft <= 0
  const seconds = Math.ceil(timeLeft / 1000)
  const totalDuration = 20 * 1000 // demo: all bets use 20s countdown
  const progress = Math.max(0, Math.min(1, timeLeft / totalDuration))

  const decimals = EC_ASSET_DECIMALS[bet.asset]

  return (
    <div
      className={`ec-card relative overflow-hidden rounded-xl transition-all duration-300 ${
        urgent
          ? 'ec-card-urgent border-2 border-[#EF4444]'
          : settling
            ? 'border border-[var(--text-tertiary)]/40 opacity-70'
            : isWinning
              ? 'border border-[#2DD4BF]/30'
              : 'border border-[#F87171]/30'
      }`}
      style={urgent ? {
        background: 'linear-gradient(to bottom, rgba(239,68,68,0.08), var(--bg-card))',
      } : { background: 'var(--bg-card)' }}
    >
      {/* Top progress bar */}
      <div className="relative w-full" style={{ height: urgent ? 4 : 3 }}>
        <div className="absolute inset-0 bg-[var(--border)]" />
        <div
          className={`absolute left-0 top-0 h-full transition-colors duration-300 ${
            urgent ? 'ec-bar-urgent' : 'bg-[#2DD4BF]'
          }`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Card body */}
      <div className="p-3 relative">
        {/* Urgent countdown digit — top right corner */}
        {urgent && (
          <div className="absolute top-2 right-3 ec-digit-pop" key={seconds}>
            <span className="text-2xl font-black tabular-nums text-[#EF4444]" style={{
              textShadow: '0 0 12px rgba(239,68,68,0.5)',
            }}>
              {seconds}
            </span>
          </div>
        )}

        {/* Direction + Asset */}
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded ${
              bet.direction === 'higher'
                ? 'bg-[#2DD4BF]/15 text-[#2DD4BF]'
                : 'bg-[#F87171]/15 text-[#F87171]'
            }`}
          >
            {bet.direction === 'higher' ? 'HIGHER' : 'LOWER'}
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)]">{bet.asset}/USDT</span>
        </div>

        {/* Estimated PnL */}
        <div className="mb-1.5">
          <span
            className={`text-xl font-bold tabular-nums transition-colors duration-150 ${
              settling
                ? 'text-[var(--text-tertiary)]'
                : isWinning
                  ? 'text-[#2DD4BF]'
                  : 'text-[#F87171]'
            }`}
          >
            {isWinning ? '+' : ''}${estimatedPnl.toFixed(2)}
          </span>
          <span className="text-[9px] text-[var(--text-tertiary)] ml-1.5">EST.</span>
        </div>
        <div className="text-[9px] text-[var(--text-tertiary)] mb-2">If settled now</div>

        {/* Details grid — full width now */}
        <div className="grid grid-cols-4 gap-x-3 gap-y-0.5 text-[10px]">
          <div>
            <span className="text-[var(--text-tertiary)] block">Entry</span>
            <span className="text-[var(--text-secondary)] tabular-nums">
              ${bet.entryPrice.toFixed(decimals)}
            </span>
          </div>
          <div>
            <span className="text-[var(--text-tertiary)] block">Current</span>
            <span className="text-[var(--text-secondary)] tabular-nums">
              ${currentPrice.toFixed(decimals)}
            </span>
          </div>
          <div>
            <span className="text-[var(--text-tertiary)] block">Amount</span>
            <span className="text-[var(--text-secondary)] tabular-nums">${bet.amount}</span>
          </div>
          <div>
            <span className="text-[var(--text-tertiary)] block">Return</span>
            <span className="text-[var(--text-secondary)] tabular-nums">
              {(bet.payout * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Settling state */}
        {settling && (
          <div className="mt-2 text-center">
            <span className="text-[10px] text-[var(--text-tertiary)]">Settling...</span>
          </div>
        )}
      </div>

      <style>{`
        .ec-card-urgent {
          animation: cardShake 0.12s ease-in-out infinite alternate;
          box-shadow: 0 0 20px rgba(239,68,68,0.3);
        }

        .ec-bar-urgent {
          background: #EF4444;
          box-shadow: 0 0 8px rgba(239,68,68,0.6);
          animation: barPulse 0.5s ease-in-out infinite alternate;
        }

        .ec-digit-pop {
          animation: digitPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes cardShake {
          0% { transform: translate(0, 0); }
          25% { transform: translate(1.5px, -0.5px); }
          50% { transform: translate(-1px, 0.5px); }
          75% { transform: translate(0.5px, -1px); }
          100% { transform: translate(-1.5px, 0.5px); }
        }

        @keyframes barPulse {
          from {
            opacity: 0.7;
            box-shadow: 0 0 6px rgba(239,68,68,0.4);
          }
          to {
            opacity: 1;
            box-shadow: 0 0 12px rgba(239,68,68,0.8);
          }
        }

        @keyframes digitPop {
          0% {
            transform: scale(1.5);
            opacity: 0.4;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes glowBreathe {
          0% { box-shadow: 0 0 12px rgba(239,68,68,0.2); }
          50% { box-shadow: 0 0 28px rgba(239,68,68,0.45); }
          100% { box-shadow: 0 0 12px rgba(239,68,68,0.2); }
        }

        .ec-card-urgent {
          animation: cardShake 0.12s ease-in-out infinite alternate, glowBreathe 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
