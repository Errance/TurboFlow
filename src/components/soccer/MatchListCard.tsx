import { useNavigate } from 'react-router-dom'
import type { SoccerMatch } from '../../data/soccer/types'
import {
  formatAmmPrice,
  formatProbability,
  formatSharePrice,
  probabilityFromEuropeanOdds,
  type SoccerAmmPriceFormat,
} from '../../data/soccer/ammData'
import { useSoccerAmmStore } from '../../stores/soccerAmmStore'

interface Props {
  match: SoccerMatch
}

export default function MatchListCard({ match }: Props) {
  const navigate = useNavigate()
  const priceFormat = useSoccerAmmStore((state) => state.priceFormat)
  const homeTab = match.tabs.find((t) => t.id === 'home') ?? match.tabs.find((t) => t.id === 'all') ?? match.tabs[0]
  const markets = homeTab?.markets ?? []
  const volume24h = 380_000 + match.id.length * 9_500 + markets.length * 12_000

  const oneXTwo = markets.find((m) => m.type === 'buttonGroup' && m.title === '胜平负')
  const totals = markets.find((m) => m.type === 'oddsTable' && m.title === '大小球')
  const asian = markets.find((m) => m.type === 'oddsTable' && m.title === '让球')
  const totalsRow = totals?.type === 'oddsTable' ? totals.rows.find((r) => r.line.includes('2.5') || r.line === '2.5') : undefined

  return (
    <div
      onClick={() => navigate(`/soccer/match/${match.id}`)}
      className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)] hover:bg-[var(--bg-card)] cursor-pointer transition-colors group"
    >
      <div className="w-12 shrink-0 text-center">
        {match.status === 'live' ? (
          <div className="flex flex-col items-center gap-0.5">
            <span className="flex items-center gap-1 text-[10px] font-mono text-[#E85A7E] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E85A7E] animate-pulse" />
              进行中
            </span>
            <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{match.score?.home}-{match.score?.away}</span>
          </div>
        ) : match.status === 'finished' ? (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-mono text-[var(--text-secondary)] font-medium">完赛</span>
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
        <p className="mt-0.5 text-[10px] text-[var(--text-secondary)]">
          24h Vol. ${(volume24h / 1000).toFixed(0)}k
        </p>
      </div>

      <div className="hidden sm:flex items-center gap-1 shrink-0">
        {oneXTwo?.type === 'buttonGroup' && oneXTwo.options.map((opt, i) => (
          <PriceCell key={opt.label} label={i === 0 ? '1' : i === 1 ? 'X' : '2'} probability={probabilityFromEuropeanOdds(opt.odds)} priceFormat={priceFormat} />
        ))}
      </div>

      <div className="hidden md:flex items-center gap-1 shrink-0">
        {totalsRow && (
          <>
            <PriceCell label="大 2.5" probability={probabilityFromEuropeanOdds(totalsRow.odds[0])} priceFormat={priceFormat} />
            <PriceCell label="小 2.5" probability={probabilityFromEuropeanOdds(totalsRow.odds[1])} priceFormat={priceFormat} />
          </>
        )}
      </div>

      <div className="hidden lg:flex items-center gap-1 shrink-0">
        {asian?.type === 'oddsTable' && asian.rows[0] && (
          <>
            <PriceCell label={asian.rows[0].line.split('/')[0].trim()} probability={probabilityFromEuropeanOdds(asian.rows[0].odds[0])} priceFormat={priceFormat} wide />
            <PriceCell label={asian.rows[0].line.split('/')[1]?.trim() ?? ''} probability={probabilityFromEuropeanOdds(asian.rows[0].odds[1])} priceFormat={priceFormat} wide />
          </>
        )}
      </div>

      <div className="w-16 shrink-0 text-right">
        <span className="text-[10px] text-[#2DD4BF] group-hover:underline">More</span>
      </div>
    </div>
  )
}

function PriceCell({
  label,
  probability,
  priceFormat,
  wide,
}: {
  label: string
  probability: number
  priceFormat: SoccerAmmPriceFormat
  wide?: boolean
}) {
  return (
    <div className={`${wide ? 'w-16' : 'w-14'} text-center bg-[var(--bg-control)] border border-[var(--border)] rounded px-1.5 py-1`}>
      <span className="text-[9px] text-[var(--text-secondary)] block truncate">{label}</span>
      {priceFormat === 'probability' ? (
        <>
          <span className="block text-xs font-mono font-semibold text-[var(--text-primary)]">{formatProbability(probability)}</span>
          <span className="block text-[9px] font-mono text-[#2DD4BF]">Buy {formatSharePrice(probability)}</span>
        </>
      ) : (
        <span className="block text-xs font-mono font-medium text-[var(--text-primary)]">
          {formatAmmPrice(probability, priceFormat)}
        </span>
      )}
    </div>
  )
}
