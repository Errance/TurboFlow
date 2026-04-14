import type { OrderBook } from '../../data/clob/types'

interface Props {
  book: OrderBook
  depth?: number
  compact?: boolean
}

export default function OrderBookMini({ book, depth = 5, compact = false }: Props) {
  const bids = book.bids.slice(0, depth)
  const asks = book.asks.slice(0, depth)
  const maxQty = Math.max(
    ...bids.map(l => l.quantity),
    ...asks.map(l => l.quantity),
    1
  )

  if (compact) {
    return (
      <div className="flex items-center gap-1 h-3">
        <div className="flex-1 flex justify-end gap-px">
          {bids.slice(0, 3).reverse().map((l, i) => (
            <div
              key={i}
              className="bg-[#2DD4BF]/20 rounded-sm"
              style={{ width: `${Math.max(8, (l.quantity / maxQty) * 100)}%`, height: '100%' }}
            />
          ))}
        </div>
        <div className="w-px h-full bg-[var(--border)]" />
        <div className="flex-1 flex gap-px">
          {asks.slice(0, 3).map((l, i) => (
            <div
              key={i}
              className="bg-[#E85A7E]/20 rounded-sm"
              style={{ width: `${Math.max(8, (l.quantity / maxQty) * 100)}%`, height: '100%' }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0.5 text-[10px] font-mono">
      {asks.slice().reverse().map((l, i) => (
        <div key={`a-${i}`} className="flex items-center gap-1 h-4 relative">
          <div
            className="absolute right-0 top-0 bottom-0 bg-[#E85A7E]/10 rounded-sm"
            style={{ width: `${(l.quantity / maxQty) * 100}%` }}
          />
          <span className="w-8 text-right text-[#E85A7E] relative z-10">{l.price}¢</span>
          <span className="flex-1 text-right text-[var(--text-secondary)] relative z-10">{l.quantity}</span>
        </div>
      ))}

      <div className="h-px bg-[var(--border)] my-0.5" />

      {bids.map((l, i) => (
        <div key={`b-${i}`} className="flex items-center gap-1 h-4 relative">
          <div
            className="absolute right-0 top-0 bottom-0 bg-[#2DD4BF]/10 rounded-sm"
            style={{ width: `${(l.quantity / maxQty) * 100}%` }}
          />
          <span className="w-8 text-right text-[#2DD4BF] relative z-10">{l.price}¢</span>
          <span className="flex-1 text-right text-[var(--text-secondary)] relative z-10">{l.quantity}</span>
        </div>
      ))}
    </div>
  )
}
