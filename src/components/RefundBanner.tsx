import type { EventStatusInfo } from '../types'
import Badge from './ui/Badge'
import Button from './ui/Button'

interface RefundBannerProps {
  statusInfo: EventStatusInfo
  totalVolume: number
}

export default function RefundBanner({ statusInfo, totalVolume }: RefundBannerProps) {
  const isCancelled = statusInfo.status === 'CANCELLED'
  const isVoided = statusInfo.status === 'VOIDED'

  if (!isCancelled && !isVoided) return null

  return (
    <div className="bg-[#161622] border border-[#252536] rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="neutral">{isCancelled ? 'Cancelled' : 'Voided'}</Badge>
        <span className="text-xs text-[#8A8A9A]">Refund in progress</span>
      </div>

      <p className="text-sm text-white mb-3">{statusInfo.reason}</p>

      <div className="bg-[#0B0B0F] rounded-lg p-3 space-y-2 mb-3">
        <div className="flex justify-between text-xs">
          <span className="text-[#8A8A9A]">Refund basis</span>
          <span className="text-white">
            {isVoided ? 'Full refund at purchase price' : 'Refund at purchase price'}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#8A8A9A]">Refund status</span>
          <Badge variant="warning">Processing</Badge>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#8A8A9A]">Estimated completion</span>
          <span className="text-white">Within 24 hours</span>
        </div>
      </div>

      {statusInfo.reasonDetail && (
        <p className="text-xs text-[#8A8A9A] mb-3">{statusInfo.reasonDetail}</p>
      )}

      <Button variant="ghost" size="sm">
        View Refund Details
      </Button>
    </div>
  )
}
