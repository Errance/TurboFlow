import { useSoccerAmmStore } from '../../stores/soccerAmmStore'
import type { SoccerAmmPriceFormat } from '../../data/soccer/ammData'

const options: Array<{ id: SoccerAmmPriceFormat; label: string; hint: string }> = [
  { id: 'probability', label: '份额价格', hint: '¢ / share' },
  { id: 'european', label: '欧洲赔率', hint: '仅展示换算' },
]

export default function SoccerPriceFormatToggle() {
  const priceFormat = useSoccerAmmStore((state) => state.priceFormat)
  const setPriceFormat = useSoccerAmmStore((state) => state.setPriceFormat)

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1">
      <div className="flex gap-1">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => setPriceFormat(option.id)}
            className={`rounded-lg px-3 py-1.5 text-left transition-colors ${
              priceFormat === option.id
                ? 'bg-[#2DD4BF]/15 text-[#2DD4BF]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span className="block text-xs font-semibold">{option.label}</span>
            <span className="block text-[9px] opacity-70">{option.hint}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
