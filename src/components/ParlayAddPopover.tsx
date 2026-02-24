import { useState, useRef, useEffect } from 'react'

interface ParlayAddPopoverProps {
  yesPrice: number
  noPrice: number
  probability: number
  inParlay: boolean
  onAdd: (side: 'YES' | 'NO') => void
}

export default function ParlayAddPopover({ yesPrice, noPrice, probability, inParlay, onAdd }: ParlayAddPopoverProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const noProb = 100 - probability

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleAdd = (side: 'YES' | 'NO') => {
    onAdd(side)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors ${
          inParlay
            ? 'bg-[#2DD4BF]/20 text-[#2DD4BF]'
            : 'text-[var(--text-secondary)] hover:text-[#2DD4BF] hover:bg-[var(--border)]'
        }`}
        title={inParlay ? 'In Parlay — click to change' : 'Add to Parlay'}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          {inParlay ? (
            <path d="M3.5 7l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-1 z-50 bg-[var(--bg-control)] border border-[var(--border)] rounded-lg shadow-xl p-1 min-w-[140px] animate-[fade-in_0.1s_ease-out]">
          <p className="text-[10px] text-[var(--text-secondary)] px-2 py-1">Add to Parlay</p>
          <button
            onClick={() => handleAdd('YES')}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs hover:bg-[#2DD4BF]/10 transition-colors"
          >
            <span className="text-[#2DD4BF] font-medium">YES</span>
            <span className="text-[var(--text-secondary)] font-mono">{probability}% · {yesPrice.toFixed(2)}</span>
          </button>
          <button
            onClick={() => handleAdd('NO')}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs hover:bg-[#E85A7E]/10 transition-colors"
          >
            <span className="text-[#E85A7E] font-medium">NO</span>
            <span className="text-[var(--text-secondary)] font-mono">{noProb}% · {noPrice.toFixed(2)}</span>
          </button>
        </div>
      )}
    </div>
  )
}
