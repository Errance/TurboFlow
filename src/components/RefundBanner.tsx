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
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="neutral">{isCancelled ? '已取消' : '已作废'}</Badge>
        <span className="text-xs text-[var(--text-secondary)]">退款处理中</span>
      </div>

      <p className="text-sm text-[var(--text-primary)] mb-3">{statusInfo.reason}</p>

      <div className="bg-[var(--bg-base)] rounded-lg p-3 space-y-2 mb-3">
        <div className="flex justify-between text-xs">
          <span className="text-[var(--text-secondary)]">退款依据</span>
          <span className="text-[var(--text-primary)]">
            {isVoided ? '按买入价全额退款' : '按买入价退款'}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[var(--text-secondary)]">退款状态</span>
          <Badge variant="warning">处理中</Badge>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[var(--text-secondary)]">预计完成时间</span>
          <span className="text-[var(--text-primary)]">24 小时内</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[var(--text-secondary)]">受影响成交量</span>
          <span className="text-[var(--text-primary)]">${Math.round(totalVolume).toLocaleString('en-US')}</span>
        </div>
      </div>

      {statusInfo.reasonDetail && (
        <p className="text-xs text-[var(--text-secondary)] mb-3">{statusInfo.reasonDetail}</p>
      )}

      <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)}>
        {showDetails ? '收起退款详情' : '查看退款详情'}
      </Button>
      {showDetails && (
        <div className="mt-3 bg-[var(--bg-base)] rounded-lg p-3 space-y-2">
          <p className="text-xs text-[#C0C0D0]">
            退款将自动处理并计入 USDC 可用余额。本市场的开放委托均已取消。
          </p>
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-secondary)]">交易编号</span>
            <span className="text-[var(--text-primary)] font-mono text-[10px]">RF-{Date.now().toString(36).toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-secondary)]">开始处理时间</span>
            <span className="text-[var(--text-primary)]">{new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      )}
    </div>
  )
}
