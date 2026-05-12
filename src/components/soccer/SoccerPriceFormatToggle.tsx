import { useState } from 'react'
import { useSoccerAmmStore } from '../../stores/soccerAmmStore'
import type { SoccerAmmPriceFormat } from '../../data/soccer/ammData'

const options: Array<{ id: SoccerAmmPriceFormat; label: string; hint: string }> = [
  { id: 'probability', label: '概率 + 份额价格', hint: '96% + Buy Yes 95.9¢' },
  { id: 'european', label: '欧洲赔率', hint: '仅展示换算' },
]

export default function SoccerPriceFormatToggle() {
  const [open, setOpen] = useState(false)
  const priceFormat = useSoccerAmmStore((state) => state.priceFormat)
  const setPriceFormat = useSoccerAmmStore((state) => state.setPriceFormat)
  const current = options.find((option) => option.id === priceFormat) ?? options[0]

  const choose = (value: SoccerAmmPriceFormat) => {
    setPriceFormat(value)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition-colors hover:text-[#2DD4BF]"
        aria-label={`价格展示设置：${current.label}`}
        aria-expanded={open}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.37a1.7 1.7 0 0 0-1 .58 1.7 1.7 0 0 0-.4 1.08V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-.4-1.08 1.7 1.7 0 0 0-1-.58 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.63 15a1.7 1.7 0 0 0-.58-1 1.7 1.7 0 0 0-1.08-.4H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.08-.4 1.7 1.7 0 0 0 .58-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.63a1.7 1.7 0 0 0 1-.58A1.7 1.7 0 0 0 10.4 3V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 .4 1.08 1.7 1.7 0 0 0 1 .58 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.37 9c.22.36.58.57 1 .58H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.08.4 1.7 1.7 0 0 0-.43 1.02Z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-2 shadow-xl">
          <p className="px-2 pb-2 text-[10px] font-semibold text-[var(--text-secondary)]">价格展示</p>
        {options.map((option) => (
          <button
            key={option.id}
              type="button"
              onClick={() => choose(option.id)}
              className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
              priceFormat === option.id
                ? 'bg-[#2DD4BF]/15 text-[#2DD4BF]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span className="block text-xs font-semibold">{option.label}</span>
              <span className="mt-0.5 block text-[9px] leading-4 opacity-70">{option.hint}</span>
          </button>
        ))}
        </div>
      )}
    </div>
  )
}
