interface Props {
  price: number
  label?: string
  variant: 'yes' | 'no'
  selected?: boolean
  onClick: () => void
}

export default function PriceButton({ price, label, variant, selected, onClick }: Props) {
  const odds = price > 0 ? (100 / price).toFixed(2) : '—'

  return (
    <button
      onClick={onClick}
      className={`group relative flex-1 flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg text-center transition-all min-h-[44px] justify-center ${
        selected
          ? variant === 'yes'
            ? 'bg-[#2DD4BF]/15 border border-[#2DD4BF]/30'
            : 'bg-[#E85A7E]/15 border border-[#E85A7E]/30'
          : 'bg-[var(--bg-control)] border border-[var(--border)] hover:border-[var(--text-secondary)]/30'
      }`}
      title={`等效赔率: ${odds}`}
    >
      {label && (
        <span className={`text-[10px] leading-tight ${
          selected
            ? variant === 'yes' ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'
            : 'text-[var(--text-secondary)]'
        }`}>
          {label}
        </span>
      )}
      <span className={`text-sm font-semibold font-mono tabular-nums ${
        selected
          ? variant === 'yes' ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'
          : 'text-[var(--text-primary)]'
      }`}>
        {price}¢
      </span>
      <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[9px] text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
        赔率 {odds}
      </span>
    </button>
  )
}
