import { useToastStore } from '../stores/toastStore'
import type { PredictionEvent } from '../types'

interface ShareButtonProps {
  event: PredictionEvent
  size?: 'sm' | 'md'
}

export default function ShareButton({ event, size = 'sm' }: ShareButtonProps) {
  const addToast = useToastStore((s) => s.addToast)

  const handleShare = async () => {
    const contract = event.contracts[0]
    const prob = contract ? `${contract.probability}%` : ''
    const text = `${event.title}${prob ? ` — Currently at ${prob}` : ''}\n\nTrade on TurboFlow: https://turboflow.xyz/event/${event.id}`

    try {
      await navigator.clipboard.writeText(text)
      addToast({ type: 'success', message: 'Event link copied to clipboard' })
    } catch {
      addToast({ type: 'error', message: 'Failed to copy' })
    }
  }

  const px = size === 'sm' ? 'px-2 py-1.5' : 'px-3 py-2'
  const iconSize = size === 'sm' ? 14 : 16

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        handleShare()
      }}
      className={`${px} rounded-lg text-[#8A8A9A] hover:text-[#2DD4BF] hover:bg-[#252536] transition-colors flex items-center gap-1.5`}
      title="Share"
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="none">
        <path d="M4 8v5a1 1 0 001 1h6a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 2v8M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {size === 'md' && <span className="text-xs">Share</span>}
    </button>
  )
}
