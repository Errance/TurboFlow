import { useEventContractStore } from '../../stores/eventContractStore'

export default function EffectsSettings({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const effects = useEventContractStore((s) => s.effects)
  const updateEffects = useEventContractStore((s) => s.updateEffects)

  if (!open) return null

  const revealOptions: { value: 'on' | 'minimal' | 'off'; label: string; desc: string }[] = [
    { value: 'on', label: 'On', desc: 'Full-screen reveal animation' },
    { value: 'minimal', label: 'Minimal', desc: 'Card-level flash only' },
    { value: 'off', label: 'Off', desc: 'Silent result update' },
  ]

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Effects</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--border)] text-[var(--text-secondary)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Settlement Reveal */}
        <div className="mb-4">
          <div className="text-xs font-medium text-[var(--text-primary)] mb-2">
            Settlement Reveal
          </div>
          <div className="space-y-1.5">
            {revealOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateEffects({ settlementReveal: opt.value })}
                className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${
                  effects.settlementReveal === opt.value
                    ? 'border-[#2DD4BF]/50 bg-[#2DD4BF]/5'
                    : 'border-[var(--border)] hover:border-[var(--border)]'
                }`}
              >
                <div className="text-xs font-medium text-[var(--text-primary)]">{opt.label}</div>
                <div className="text-[10px] text-[var(--text-tertiary)]">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Hype Mode */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-[var(--text-primary)]">Hype Mode</div>
              <div className="text-[10px] text-[var(--text-tertiary)]">
                Streak & comeback ceremonies
              </div>
            </div>
            <button
              onClick={() => updateEffects({ hypeMode: !effects.hypeMode })}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                effects.hypeMode ? 'bg-[#2DD4BF]' : 'bg-[var(--border)]'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  effects.hypeMode ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
