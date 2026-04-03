import { useState, type ReactNode } from 'react'

interface MarketCardProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export default function MarketCard({ title, children, defaultOpen = true }: MarketCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--border)]/30 transition-colors"
      >
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          className={`text-[var(--text-secondary)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}
