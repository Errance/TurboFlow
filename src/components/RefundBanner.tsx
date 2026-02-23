import { useState } from 'react'
import type { EventStatusInfo } from '../types'
import Badge from './ui/Badge'
import Button from './ui/Button'

interface RefundBannerProps {
  statusInfo: EventStatusInfo
  totalVolume: number
}

export default function RefundBanner({ statusInfo, totalVolume }: RefundBannerProps) {
  const [showDetails, setShowDetails] = useState(false)
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
        <div className="flex justify-between text-xs">
          <span className="text-[#8A8A9A]">Affected volume</span>
          <span className="text-white">${Math.round(totalVolume).toLocaleString('en-US')}</span>
        </div>
      </div>

      {statusInfo.reasonDetail && (
        <p className="text-xs text-[#8A8A9A] mb-3">{statusInfo.reasonDetail}</p>
      )}

      <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)}>
        {showDetails ? 'Hide Refund Details' : 'View Refund Details'}
      </Button>
      {showDetails && (
        <div className="mt-3 bg-[#0B0B0F] rounded-lg p-3 space-y-2">
          <p className="text-xs text-[#C0C0D0]">
            Refunds are processed automatically and credited to your USDC balance.
            All open orders on this market have been cancelled.
          </p>
          <div className="flex justify-between text-xs">
            <span className="text-[#8A8A9A]">Transaction ID</span>
            <span className="text-white font-mono text-[10px]">RF-{Date.now().toString(36).toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#8A8A9A]">Processing started</span>
            <span className="text-white">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      )}
    </div>
  )
}
