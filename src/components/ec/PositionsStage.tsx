import { useState, useEffect } from 'react'
import { useEventContractStore } from '../../stores/eventContractStore'
import PositionCard from './PositionCard'
import HistoryDrawer from './HistoryDrawer'
import GlobalFeed from './GlobalFeed'

type TabId = 'my' | 'all'

export default function PositionsStage() {
  const getSortedActiveBets = useEventContractStore((s) => s.getSortedActiveBets)
  const [bets, setBets] = useState(getSortedActiveBets())
  const [historyOpen, setHistoryOpen] = useState(false)
  const [tab, setTab] = useState<TabId>('my')

  useEffect(() => {
    const id = setInterval(() => {
      setBets(getSortedActiveBets())
    }, 200)
    return () => clearInterval(id)
  }, [getSortedActiveBets])

  return (
    <section>
      {/* Header with tabs */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1 bg-[var(--bg-base)] rounded-lg p-0.5">
          <button
            onClick={() => setTab('my')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              tab === 'my'
                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            My Positions
            {tab === 'my' && bets.length > 0 && (
              <span className="ml-1 text-[10px] text-[var(--text-tertiary)]">({bets.length})</span>
            )}
          </button>
          <button
            onClick={() => setTab('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              tab === 'all'
                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            All
          </button>
        </div>

        <button
          onClick={() => setHistoryOpen(true)}
          className="text-xs text-[var(--text-secondary)] hover:text-[#2DD4BF] transition-colors"
        >
          History
        </button>
      </div>

      {/* Tab content */}
      {tab === 'my' ? (
        <>
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
        </>
      ) : (
        <GlobalFeed />
      )}

      <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </section>
  )
}
