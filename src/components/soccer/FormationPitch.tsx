import { useState } from 'react'
import type { MatchLineup, MatchPlayer } from '../../data/soccer/types'

interface Props {
  homeLineup: MatchLineup
  awayLineup: MatchLineup
  homeShort: string
  awayShort: string
}

const positionOrder = ['GK', 'DEF', 'MID', 'FWD'] as const

function getPlayerColor(position: MatchPlayer['position'], activeIndex: number) {
  if (position === 'GK') return 'bg-amber-600 text-white border-2 border-white/60'
  return activeIndex === 0
    ? 'bg-[#1d6b35] text-white border-2 border-white/60'
    : 'bg-[#1a3a6b] text-white border-2 border-white/60'
}

export default function FormationPitch({ homeLineup, awayLineup, homeShort, awayShort }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const lineup = activeIndex === 0 ? homeLineup : awayLineup
  const label = activeIndex === 0 ? homeShort : awayShort

  const maxRow = Math.max(...lineup.players.map((p) => p.gridRow))

  const rowGroups: Record<number, typeof lineup.players> = {}
  for (const p of lineup.players) {
    if (!rowGroups[p.gridRow]) rowGroups[p.gridRow] = []
    rowGroups[p.gridRow].push(p)
  }

  const subsByPos = positionOrder.reduce<Partial<Record<MatchPlayer['position'], MatchPlayer[]>>>((acc, pos) => {
    const group = lineup.substitutes.filter((s) => s.position === pos)
    if (group.length > 0) acc[pos] = group
    return acc
  }, {})

  return (
    <div className="relative select-none">
      {/* Team switcher tabs */}
      <div className="flex mb-2">
        {[
          { idx: 0, tabLabel: homeShort },
          { idx: 1, tabLabel: awayShort },
        ].map(({ idx, tabLabel }) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={`flex-1 py-2 text-xs font-medium text-center transition-colors border-b-2 ${
              activeIndex === idx
                ? 'text-[var(--text-primary)] border-[#2DD4BF]'
                : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
            }`}
          >
            {tabLabel}
          </button>
        ))}
      </div>

      {/* Pitch */}
      <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: '4/5' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a5c2a] via-[#1e6b31] to-[#1a5c2a]" />

        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0"
            style={{
              top: `${(i / 8) * 100}%`,
              height: `${100 / 8}%`,
              background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
            }}
          />
        ))}

        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 500" fill="none">
          <rect x="20" y="15" width="360" height="470" rx="2" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          <line x1="20" y1="250" x2="380" y2="250" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          <circle cx="200" cy="250" r="50" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          <circle cx="200" cy="250" r="3" fill="rgba(255,255,255,0.3)" />
          <rect x="110" y="15" width="180" height="75" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          <rect x="150" y="15" width="100" height="30" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          <circle cx="200" cy="68" r="3" fill="rgba(255,255,255,0.3)" />
          <rect x="110" y="410" width="180" height="75" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          <rect x="150" y="455" width="100" height="30" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          <circle cx="200" cy="432" r="3" fill="rgba(255,255,255,0.3)" />
          <path d="M20 25 A10 10 0 0 1 30 15" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          <path d="M370 15 A10 10 0 0 1 380 25" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          <path d="M20 475 A10 10 0 0 0 30 485" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          <path d="M370 485 A10 10 0 0 0 380 475" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
        </svg>

        {/* Players */}
        <div className="absolute inset-0 flex flex-col justify-between py-[8%] px-[5%]">
          {Array.from({ length: maxRow + 1 }).map((_, rowIdx) => {
            const rowPlayers = [...(rowGroups[rowIdx] ?? [])].sort((a, b) => a.gridCol - b.gridCol)
            return (
              <div key={rowIdx} className="flex justify-around items-center">
                {rowPlayers.map((player) => (
                  <div key={player.number} className="flex flex-col items-center gap-0.5">
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ${getPlayerColor(player.position, activeIndex)}`}>
                        {player.number}
                      </div>
                      {player.isCaptain && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-400 rounded-full text-[7px] font-bold text-black flex items-center justify-center">
                          C
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-white/90 font-medium text-center leading-tight max-w-[60px] truncate">
                      {player.name.split(' ').pop()}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white/50 font-medium">
          {label} {lineup.formation}
        </div>
      </div>

      {/* Manager row */}
      <div className="flex items-center justify-between px-3 py-2 mt-1">
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>{lineup.manager}</span>
        </div>
        <span className="text-[10px] text-[var(--text-secondary)]/60">Manager</span>
      </div>

      {/* Substitutes */}
      {lineup.substitutes.length > 0 && (
        <div className="px-3 pb-2 space-y-1.5">
          <div className="text-[10px] font-medium text-[var(--text-secondary)]/70 uppercase tracking-wider">替补</div>
          {positionOrder.map((pos) => {
            const group = subsByPos[pos]
            if (!group) return null
            return (
              <div key={pos} className="flex items-start gap-1.5">
                <span className="text-[10px] font-semibold text-[var(--text-secondary)]/50 w-7 shrink-0">{pos}</span>
                <span className="text-[10px] text-[var(--text-secondary)]/70 leading-relaxed">
                  {group.map((s, i) => (
                    <span key={s.number}>
                      {i > 0 && <span className="mx-1 text-[var(--text-secondary)]/30">·</span>}
                      <span className="font-medium text-[var(--text-secondary)]">{s.number}</span>{' '}
                      {s.name.split(' ').pop()}
                    </span>
                  ))}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
