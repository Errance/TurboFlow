import type { MatchEvent } from '../../data/soccer/types'

interface Props {
  events: MatchEvent[]
}

function EventIcon({ type }: { type: MatchEvent['type'] }) {
  switch (type) {
    case 'goal':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      )
    case 'yellow_card':
      return <div className="w-3 h-4 rounded-[1px] bg-yellow-400" />
    case 'red_card':
      return <div className="w-3 h-4 rounded-[1px] bg-red-500" />
    case 'substitution':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 17l5-5-5-5" />
          <path d="M17 7l-5 5 5 5" />
        </svg>
      )
    case 'var':
      return (
        <span className="text-[8px] font-bold bg-blue-600 text-white px-1 rounded">VAR</span>
      )
  }
}

function eventColor(type: MatchEvent['type']) {
  switch (type) {
    case 'goal': return 'text-emerald-400'
    case 'yellow_card': return 'text-yellow-400'
    case 'red_card': return 'text-red-500'
    case 'substitution': return 'text-blue-400'
    case 'var': return 'text-blue-400'
  }
}

export default function MatchTimeline({ events }: Props) {
  const sorted = [...events].sort((a, b) => a.minute - b.minute)

  return (
    <div className="px-3 py-4">
      <div className="relative">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--border)]" />

        <div className="space-y-3">
          {sorted.map((ev, i) => {
            const isHome = ev.team === 'home'
            return (
              <div
                key={i}
                className={`flex items-center gap-2 ${isHome ? 'flex-row' : 'flex-row-reverse'}`}
              >
                {/* Content side */}
                <div className={`flex-1 ${isHome ? 'text-right pr-3' : 'text-left pl-3'}`}>
                  <p className="text-xs font-medium text-[var(--text-primary)]">{ev.playerName}</p>
                  {ev.detail && (
                    <p className="text-[10px] text-[var(--text-secondary)]">{ev.detail}</p>
                  )}
                </div>

                {/* Center icon */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center ${eventColor(ev.type)}`}>
                    <EventIcon type={ev.type} />
                  </div>
                  <span className="text-[9px] text-[var(--text-secondary)] font-mono mt-0.5">{ev.minute}'</span>
                </div>

                {/* Empty side */}
                <div className="flex-1" />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
