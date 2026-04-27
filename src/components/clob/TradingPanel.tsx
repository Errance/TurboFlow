import { useState, useEffect, useCallback } from 'react'
import type { TradingSelection, OrderSide, OrderType } from '../../data/clob/types'
import { useClobStore } from '../../stores/clobStore'

interface Props {
  selection: TradingSelection | null
}

export default function TradingPanel({ selection }: Props) {
  const { balance, placeOrder } = useClobStore()
  const [side, setSide] = useState<OrderSide>('yes')
  const [orderType, setOrderType] = useState<OrderType>('market')
  const [price, setPrice] = useState('')
  const [shares, setShares] = useState('')
  const [total, setTotal] = useState('')
  const [, setLastTouched] = useState<'price' | 'shares' | 'total'>('total')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (selection) {
      setSide(selection.side)
      const p = selection.side === 'yes' ? selection.currentYesPrice : selection.currentNoPrice
      setPrice(String(p))
      setShares('')
      setTotal('')
      setSubmitted(false)
    }
  }, [selection])

  const recalc = useCallback((field: 'price' | 'shares' | 'total', val: string) => {
    const p = field === 'price' ? parseFloat(val) || 0 : parseFloat(price) || 0
    const s = field === 'shares' ? parseFloat(val) || 0 : parseFloat(shares) || 0
    const t = field === 'total' ? parseFloat(val) || 0 : parseFloat(total) || 0

    if (field === 'total' && p > 0) {
      const newShares = Math.floor((t / p) * 100)
      setShares(newShares > 0 ? String(newShares) : '')
    } else if (field === 'shares' && p > 0) {
      const newTotal = Math.round(s * p) / 100
      setTotal(newTotal > 0 ? newTotal.toFixed(2) : '')
    } else if (field === 'price' && s > 0) {
      const newTotal = Math.round(s * p) / 100
      setTotal(newTotal > 0 ? newTotal.toFixed(2) : '')
    }
  }, [price, shares, total])

  const numPrice = parseFloat(price) || 0
  const numShares = parseFloat(shares) || 0
  const numTotal = parseFloat(total) || 0
  const maxPayout = numShares * 1
  const profit = maxPayout - numTotal
  const canSubmit = numPrice >= 1 && numPrice <= 99 && numShares > 0 && numTotal > 0 && numTotal <= balance.available

  const handleSubmit = () => {
    if (!selection || !canSubmit) return

    const result = placeOrder({
      marketId: selection.marketId,
      outcomeId: selection.outcomeId,
      side,
      type: orderType,
      price: orderType === 'limit' ? numPrice : undefined,
      shares: numShares,
      total: numTotal,
    })

    if (result) {
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 2000)
      setShares('')
      setTotal('')
    }
  }

  if (!selection) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">交易面板</h3>
        <p className="text-xs text-[var(--text-secondary)] text-center py-6">
          点击市场价格开始交易
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">交易面板</h3>
        <span className="text-[10px] text-[var(--text-secondary)] font-mono">
          余额: ${balance.available.toFixed(2)}
        </span>
      </div>

      <div className="text-xs text-[var(--text-secondary)] truncate">
        {selection.question}
        {selection.outcomeLabel && <span className="text-[var(--text-primary)] ml-1">· {selection.outcomeLabel}</span>}
      </div>

      {/* 是/否切换 */}
      <div className="flex gap-1 p-0.5 bg-[var(--bg-control)] rounded-lg">
        <button
          onClick={() => {
            setSide('yes')
            if (selection) setPrice(String(selection.currentYesPrice))
          }}
          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
            side === 'yes'
              ? 'bg-[#2DD4BF]/20 text-[#2DD4BF]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          是 {selection.currentYesPrice}¢
        </button>
        <button
          onClick={() => {
            setSide('no')
            if (selection) setPrice(String(selection.currentNoPrice))
          }}
          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
            side === 'no'
              ? 'bg-[#E85A7E]/20 text-[#E85A7E]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          否 {selection.currentNoPrice}¢
        </button>
      </div>

      {/* Market/Limit toggle */}
      <div className="flex gap-1 p-0.5 bg-[var(--bg-control)] rounded-lg">
        <button
          onClick={() => setOrderType('market')}
          className={`flex-1 py-1 rounded-md text-[10px] font-medium transition-all ${
            orderType === 'market'
              ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-secondary)]'
          }`}
        >
          市价
        </button>
        <button
          onClick={() => setOrderType('limit')}
          className={`flex-1 py-1 rounded-md text-[10px] font-medium transition-all ${
            orderType === 'limit'
              ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-secondary)]'
          }`}
        >
          限价
        </button>
      </div>

      {/* Price input (limit only) */}
      {orderType === 'limit' && (
        <div>
          <label className="text-[10px] text-[var(--text-secondary)] mb-1 block">价格 (¢)</label>
          <input
            type="number"
            min="1"
            max="99"
            value={price}
            onChange={e => {
              setPrice(e.target.value)
              setLastTouched('price')
              recalc('price', e.target.value)
            }}
            className="w-full px-3 py-2 bg-[var(--bg-control)] border border-[var(--border)] rounded-lg text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:border-[#2DD4BF]/50"
          />
        </div>
      )}

      {/* Shares */}
      <div>
        <label className="text-[10px] text-[var(--text-secondary)] mb-1 block">份额</label>
        <input
          type="number"
          min="1"
          value={shares}
          onChange={e => {
            setShares(e.target.value)
            setLastTouched('shares')
            recalc('shares', e.target.value)
          }}
          placeholder="0"
          className="w-full px-3 py-2 bg-[var(--bg-control)] border border-[var(--border)] rounded-lg text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:border-[#2DD4BF]/50"
        />
      </div>

      {/* Total */}
      <div>
        <label className="text-[10px] text-[var(--text-secondary)] mb-1 block">总额 (USDC)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={total}
          onChange={e => {
            setTotal(e.target.value)
            setLastTouched('total')
            recalc('total', e.target.value)
          }}
          placeholder="0.00"
          className="w-full px-3 py-2 bg-[var(--bg-control)] border border-[var(--border)] rounded-lg text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:border-[#2DD4BF]/50"
        />
        <div className="flex gap-1 mt-1">
          {[10, 25, 50, 100].map(v => (
            <button
              key={v}
              onClick={() => {
                setTotal(String(v))
                setLastTouched('total')
                recalc('total', String(v))
              }}
              className="flex-1 py-0.5 text-[9px] text-[var(--text-secondary)] bg-[var(--bg-control)] border border-[var(--border)] rounded hover:border-[#2DD4BF]/30 transition-colors"
            >
              ${v}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
        <div className="flex justify-between text-[10px]">
          <span className="text-[var(--text-secondary)]">平均价格</span>
          <span className="font-mono text-[var(--text-primary)]">{numPrice > 0 ? `${numPrice}¢` : '—'}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-[var(--text-secondary)]">份额</span>
          <span className="font-mono text-[var(--text-primary)]">{numShares > 0 ? numShares : '—'}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-[var(--text-secondary)]">最大赔付</span>
          <span className="font-mono text-[var(--text-primary)]">{maxPayout > 0 ? `$${maxPayout.toFixed(2)}` : '—'}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[var(--text-secondary)]">潜在收益</span>
          <span className={`font-mono font-semibold ${profit > 0 ? 'text-[#2DD4BF]' : 'text-[var(--text-secondary)]'}`}>
            {profit > 0 ? `+$${profit.toFixed(2)} (${numTotal > 0 ? ((profit / numTotal) * 100).toFixed(0) : 0}%)` : '—'}
          </span>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${
          submitted
            ? 'bg-[#2DD4BF] text-[#0B0B0F]'
            : canSubmit
              ? side === 'yes'
                ? 'bg-[#2DD4BF] hover:bg-[#2DD4BF]/90 text-[#0B0B0F]'
                : 'bg-[#E85A7E] hover:bg-[#E85A7E]/90 text-white'
              : 'bg-[var(--bg-control)] text-[var(--text-secondary)] cursor-not-allowed'
        }`}
      >
        {submitted
          ? '✓ 订单已提交'
          : `${side === 'yes' ? '买入是' : '买入否'} · $${numTotal > 0 ? numTotal.toFixed(2) : '0.00'}`
        }
      </button>
    </div>
  )
}
