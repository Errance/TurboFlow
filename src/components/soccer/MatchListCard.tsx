import { useNavigate } from 'react-router-dom'
import type { SoccerMatch } from '../../data/soccer/types'

interface Props {
  match: SoccerMatch
}

export default function MatchListCard({ match }: Props) {
  const navigate = useNavigate()
  const homeTab = match.tabs.find((t) => t.id === 'home')
  const markets = homeTab?.markets ?? []

  const oneXTwo = markets.find((m) => m.type === 'buttonGroup' && m.title === '胜平负')
  const totals = markets.find((m) => m.type === 'oddsTable' && m.title === '合计')
  const asian = markets.find((m) => m.type === 'oddsTable' && m.title === '亚洲让分盘')
  const totalsRow = totals?.type === 'oddsTable' ? totals.rows.find((r) => r.line.includes('2.5') || r.line === '2.5') : undefined

  return (
    <div
      onClick={() => navigate(`/soccer/match/${match.id}`)}
      className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)] hover:bg-[var(--bg-card)] cursor-pointer transition-colors group"
    >
      <div className="w-12 shrink-0 text-center">
        {match.status === 'live' ? (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-mono text-[#E85A7E] font-medium">LIVE</span>
            <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{match.score?.home}-{match.score?.away}</span>
          </div>
        ) : match.status === 'finished' ? (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-mono text-[var(--text-secondary)] font-medium">FT</span>
            <span className="text-xs font-mono font-bold text-[var(--text-secondary)]">{match.score?.home}-{match.score?.away}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-[var(--text-secondary)]">{match.date}</span>
            <span className="text-xs font-mono text-[var(--text-primary)]">{match.time}</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-[var(--text-primary)] truncate">{match.homeTeam.name}</span>
          <span className="text-[10px] text-[var(--text-secondary)]">vs</span>
          <span className="text-sm text-[var(--text-primary)] truncate">{match.awayTeam.name}</span>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-1 shrink-0">
        {oneXTwo?.type === 'buttonGroup' && oneXTwo.options.map((opt) => (
          <div key={opt.label} className="w-14 text-center bg-[var(--bg-control)] border border-[var(--border)] rounded px-1.5 py-1">
            <span className="text-[9px] text-[var(--text-secondary)] block">{opt.label.length > 4 ? '1' : opt.label === '平局' ? 'X' : '2'}</span>
            <span className="text-xs font-mono font-medium text-[var(--text-primary)]">{opt.odds.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="hidden md:flex items-center gap-1 shrink-0">
        {totalsRow && (
          <>
            <div className="w-14 text-center bg-[var(--bg-control)] border border-[var(--border)] rounded px-1.5 py-1">
              <span className="text-[9px] text-[var(--text-secondary)]">O 2.5</span>
              <span className="text-xs font-mono font-medium text-[var(--text-primary)] block">{totalsRow.odds[0].toFixed(2)}</span>
            </div>
            <div className="w-14 text-center bg-[var(--bg-control)] border border-[var(--border)] rounded px-1.5 py-1">
              <span className="text-[9px] text-[var(--text-secondary)]">U 2.5</span>
              <span className="text-xs font-mono font-medium text-[var(--text-primary)] block">{totalsRow.odds[1].toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      <div className="hidden lg:flex items-center gap-1 shrink-0">
        {asian?.type === 'oddsTable' && asian.rows[0] && (
          <>
            <div className="w-16 text-center bg-[var(--bg-control)] border border-[var(--border)] rounded px-1 py-1">
              <span className="text-[9px] text-[var(--text-secondary)] block truncate">{asian.rows[0].line.split('/')[0].trim()}</span>
              <span className="text-xs font-mono font-medium text-[var(--text-primary)]">{asian.rows[0].odds[0].toFixed(2)}</span>
            </div>
            <div className="w-16 text-center bg-[var(--bg-control)] border border-[var(--border)] rounded px-1 py-1">
              <span className="text-[9px] text-[var(--text-secondary)] block truncate">{asian.rows[0].line.split('/')[1]?.trim()}</span>
              <span className="text-xs font-mono font-medium text-[var(--text-primary)]">{asian.rows[0].odds[1].toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      <div className="w-16 shrink-0 text-right">
        <span className="text-[10px] text-[#2DD4BF] group-hover:underline">+{match.tabs.length > 1 ? match.tabs.length * 8 : 4}</span>
      </div>
    </div>
  )
}
