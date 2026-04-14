import { useClobStore } from '../../stores/clobStore'

export default function WalletBar() {
  const { balance } = useClobStore()
  const total = balance.available + balance.inPositions + balance.inOrders

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[10px]">
      <div className="flex flex-col items-center flex-1">
        <span className="text-[var(--text-secondary)]">可用</span>
        <span className="font-mono font-semibold text-[#2DD4BF]">${balance.available.toFixed(2)}</span>
      </div>
      <div className="w-px h-6 bg-[var(--border)]" />
      <div className="flex flex-col items-center flex-1">
        <span className="text-[var(--text-secondary)]">持仓中</span>
        <span className="font-mono font-semibold text-[var(--text-primary)]">${balance.inPositions.toFixed(2)}</span>
      </div>
      <div className="w-px h-6 bg-[var(--border)]" />
      <div className="flex flex-col items-center flex-1">
        <span className="text-[var(--text-secondary)]">挂单中</span>
        <span className="font-mono font-semibold text-[var(--text-primary)]">${balance.inOrders.toFixed(2)}</span>
      </div>
      <div className="w-px h-6 bg-[var(--border)]" />
      <div className="flex flex-col items-center flex-1">
        <span className="text-[var(--text-secondary)]">总计</span>
        <span className="font-mono font-semibold text-[var(--text-primary)]">${total.toFixed(2)}</span>
      </div>
    </div>
  )
}
