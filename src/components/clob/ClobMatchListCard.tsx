import { useNavigate } from 'react-router-dom'
import type { ClobMatchSummary } from '../../data/clob/types'

interface Props {
  match: ClobMatchSummary
}

function PriceCell({ label, price }: { label: string; price: number }) {
  const odds = price > 0 ? (100 / price).toFixed(2) : '—'
  return (
    <div
      className="w-14 text-center bg-[var(--bg-control)] border border-[var(--border)] rounded px-1.5 py-1 group/cell relative"
      title={`赔率 ${odds}`}
    >
      <span className="text-[9px] text-[var(--text-secondary)] block">{label}</span>
      <span className="text-xs font-mono font-medium text-[var(--text-primary)]">{price}¢</span>
    </div>
  )
}

export default function ClobMatchListCard({ match }: Props) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/clob/match/${match.id}`)}
      className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)] hover:bg-[var(--bg-card)] cursor-pointer transition-colors group"
    >
      {/* Time / Status */}
      <div className="w-12 shrink-0 text-center">
        {match.status === 'live' ? (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-mono text-[#E85A7E] font-medium">LIVE</span>
            <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
              {match.score?.home}-{match.score?.away}
            </span>
          </div>
        ) : match.status === 'finished' ? (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-mono text-[var(--text-secondary)] font-medium">FT</span>
            <span className="text-xs font-mono font-bold text-[var(--text-secondary)]">
              {match.score?.home}-{match.score?.away}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-[var(--text-secondary)]">{match.date}</span>
            <span className="text-xs font-mono text-[var(--text-primary)]">{match.time}</span>
          </div>
        )}
      </div>

      {/* Teams */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-[var(--text-primary)] truncate">{match.homeTeam.name}</span>
          <span className="text-[10px] text-[var(--text-secondary)]">vs</span>
          <span className="text-sm text-[var(--text-primary)] truncate">{match.awayTeam.name}</span>
        </div>
      </div>

      {/* Moneyline (1X2) */}
      <div className="hidden sm:flex items-center gap-1 shrink-0">
        <PriceCell label="1" price={match.moneyline.home} />
        <PriceCell label="X" price={match.moneyline.draw} />
        <PriceCell label="2" price={match.moneyline.away} />
      </div>

      {/* O/U */}
      <div className="hidden md:flex items-center gap-1 shrink-0">
        <PriceCell label={`O ${match.totalLine.line}`} price={match.totalLine.overPrice} />
        <PriceCell label={`U ${match.totalLine.line}`} price={match.totalLine.underPrice} />
      </div>

      {/* Asian */}
      <div className="hidden lg:flex items-center gap-1 shrink-0">
        <PriceCell label={match.asianLine.line.split('/')[0].trim()} price={match.asianLine.homePrice} />
        <PriceCell label={match.asianLine.line.split('/')[1]?.trim() ?? ''} price={match.asianLine.awayPrice} />
      </div>

      {/* Market count */}
      <div className="w-16 shrink-0 text-right">
        <span className="text-[10px] text-[#2DD4BF] group-hover:underline">{match.marketCount} 市场</span>
      </div>
    </div>
  )
}
