import { useNavigate } from 'react-router-dom'
import type { TraderMock, CopyButtonState } from '../../data/copyTrading'

// Figma: card 462×276, border #0abab5, rounded 8px; PNL 24px #0abab5; labels 12px #84888b; button #0abab5 40px
const TEAL = '#0abab5'
const LABEL_GRAY = '#84888b'
const MUTED_GRAY = '#b1b5c3'

interface TraderCardProps {
  trader: TraderMock
  onCopyClick?: (id: string, current: CopyButtonState) => void
}

function formatPnl(value: number): string {
  const prefix = value >= 0 ? '+' : ''
  return prefix + '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatRoi(value: number): string {
  const prefix = value >= 0 ? '+' : ''
  return prefix + value.toFixed(2) + '%'
}

export default function TraderCard({ trader, onCopyClick }: TraderCardProps) {
  const navigate = useNavigate()
  const pnlPositive = trader.pnl180d >= 0
  const roiPositive = trader.roi30d >= 0

  const handleCardClick = () => {
    navigate(`/copy/trader/${trader.id}`)
  }

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCopyClick?.(trader.id, trader.copyButton)
  }

  const buttonText = trader.copyButton === 'Copy' ? 'Copy' : trader.copyButton === 'Full' ? 'Full' : 'Copying'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      className="flex flex-col w-full min-h-[276px] max-w-[462px] rounded-lg border cursor-pointer transition-opacity hover:opacity-95"
      style={{
        borderColor: TEAL,
        backgroundColor: 'var(--bg-card)',
      }}
    >
      {/* Top: avatar + name + followers + star (Figma layout) */}
      <div className="flex items-start justify-between gap-2 p-4 pb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium shrink-0"
            style={{ backgroundColor: 'var(--border)' }}
          >
            <span style={{ color: 'white' }}>{trader.nickname.slice(0, 1).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white leading-tight">{trader.nickname}</p>
            <p className="text-[10px] leading-tight mt-0.5">
              <span style={{ color: 'white' }}>{trader.followerCount} / </span>
              <span style={{ color: MUTED_GRAY }}>{trader.followerMax}</span>
            </p>
          </div>
        </div>
        {trader.starred && (
          <button
            type="button"
            className="p-1 text-[var(--text-secondary)] hover:opacity-80"
            onClick={(e) => e.stopPropagation()}
            aria-label="Starred"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        )}
      </div>

      {/* 180D PNL - large teal (Figma 24px) */}
      <div className="px-4 pt-1">
        <p className="text-xs font-medium" style={{ color: LABEL_GRAY }}>
          180D PNL
        </p>
        <p
          className="text-2xl font-semibold leading-tight"
          style={{ color: pnlPositive ? TEAL : '#E85A7E' }}
        >
          {formatPnl(trader.pnl180d)}
        </p>
      </div>

      {/* 30D ROI (Figma 12px teal) */}
      <div className="px-4 pt-1">
        <p className="text-xs font-medium" style={{ color: LABEL_GRAY }}>
          30D ROI:
        </p>
        <p
          className="text-xs font-medium"
          style={{ color: roiPositive ? TEAL : '#E85A7E' }}
        >
          {formatRoi(trader.roi30d)}
        </p>
      </div>

      {/* AUM, 30D MDD, Sharpe - row (Figma: labels #84888b, values white 12px) */}
      <div className="px-4 pt-3 flex flex-wrap gap-x-6 gap-y-0.5">
        <div>
          <p className="text-xs font-medium underline" style={{ color: LABEL_GRAY }}>
            AUM
          </p>
          <p className="text-xs font-medium text-white">{trader.aum}</p>
        </div>
        <div>
          <p className="text-xs font-medium underline" style={{ color: LABEL_GRAY }}>
            30D MDD
          </p>
          <p className="text-xs font-medium text-white">{trader.mdd30d}</p>
        </div>
        <div>
          <p className="text-xs font-medium underline" style={{ color: LABEL_GRAY }}>
            Sharpe Ratio
          </p>
          <p className="text-xs font-medium text-white">{trader.sharpe}</p>
        </div>
      </div>

      {/* Chart placeholder (Figma has performance graph area) */}
      <div className="flex-1 min-h-[48px] mx-4 mt-2 rounded overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(10,186,181,0.15) 0%, transparent 100%)' }}>
        <svg width="100%" height="100%" viewBox="0 0 120 40" preserveAspectRatio="none" className="block w-full h-10">
          <path
            d="M0 32 Q20 28 40 24 T80 16 T120 8"
            fill="none"
            stroke={TEAL}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Copy button (Figma: full width, h-10, bg #0abab5, rounded 8px, white 16px) */}
      <div className="p-4 pt-2">
        <button
          type="button"
          onClick={handleCopyClick}
          disabled={trader.copyButton === 'Copying'}
          className="w-full h-10 rounded-lg font-medium text-base text-white text-center transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: TEAL }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  )
}
