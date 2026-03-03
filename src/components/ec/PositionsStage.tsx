import { useState, useEffect } from 'react'
import { useEventContractStore } from '../../stores/eventContractStore'
import PositionCard from './PositionCard'
import HistoryDrawer from './HistoryDrawer'

export default function PositionsStage() {
  const getSortedActiveBets = useEventContractStore((s) => s.getSortedActiveBets)
  const [bets, setBets] = useState(getSortedActiveBets())
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setBets(getSortedActiveBets())
    }, 200)
    return () => clearInterval(id)
  }, [getSortedActiveBets])

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          My Positions
          {bets.length > 0 && (
            <span className="ml-1.5 text-xs text-[var(--text-tertiary)]">({bets.length})</span>
          )}
        </h2>
        <button
          onClick={() => setHistoryOpen(true)}
          className="text-xs text-[var(--text-secondary)] hover:text-[#2DD4BF] transition-colors"
        >
          History
        </button>
      </div>

      {/* Positions list */}
      {bets.length === 0 ? (
        <div className="text-center py-10 text-sm text-[var(--text-tertiary)]">
          <div className="text-2xl mb-2">🎯</div>
          No active positions — place a bet to start
        </div>
      ) : (
        <div className="space-y-2">
          {bets.map((bet) => (
            <PositionCard key={bet.id} bet={bet} />
          ))}
        </div>
      )}

      <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </section>
  )
}
