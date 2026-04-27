import { useState, useCallback, useEffect } from 'react'
import { useOrderStore } from '../stores/orderStore'
import { useToastStore } from '../stores/toastStore'
import Button from './ui/Button'
import SegmentedControl from './ui/SegmentedControl'
import Modal from './ui/Modal'
import type { Market, OrderSide } from '../types'

const MOCK_BALANCE = 1000

function fmt(v: number): string {
  return v.toFixed(2)
}

interface Props {
  market: Market
  contractId?: string
  prefillPrice?: number
  prefillSide?: OrderSide
  onOrderPlaced?: () => void
}

export default function LimitOrderPanel({
  market,
  contractId,
  prefillPrice,
  prefillSide,
  onOrderPlaced,
}: Props) {
  const [side, setSide] = useState<OrderSide>(prefillSide ?? 'YES')
  const [price, setPrice] = useState(prefillPrice?.toString() ?? '')
  const [shares, setShares] = useState('')
  const [total, setTotal] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [tif, setTif] = useState('GTC')
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (prefillPrice !== undefined) setPrice(prefillPrice.toString())
    if (prefillSide) setSide(prefillSide)
  }, [prefillPrice, prefillSide])

  const priceNum = parseFloat(price) || 0
  const sharesNum = parseFloat(shares) || 0
  const isValid = priceNum > 0 && priceNum <= 0.99 && sharesNum > 0

  const handlePriceChange = (val: string) => {
    setPrice(val)
    const p = parseFloat(val) || 0
    if (p > 0 && sharesNum > 0) {
      setTotal(fmt(p * sharesNum))
    }
  }

  const handleSharesChange = (val: string) => {
    setShares(val)
    const s = parseFloat(val) || 0
    if (priceNum > 0 && s > 0) {
      setTotal(fmt(priceNum * s))
    }
  }

  const handleTotalChange = (val: string) => {
    setTotal(val)
    const t = parseFloat(val) || 0
    if (priceNum > 0 && t > 0) {
      setShares(Math.floor(t / priceNum).toString())
    }
  }

  const handlePercentClick = (pct: number) => {
    const budget = MOCK_BALANCE * (pct / 100)
    if (priceNum > 0) {
      const s = Math.floor(budget / priceNum)
      setShares(s.toString())
      setTotal(fmt(priceNum * s))
    } else {
      setTotal(fmt(budget))
    }
  }

  const handleSubmit = useCallback(() => {
    if (!isValid) return
    setShowConfirm(true)
  }, [isValid])

  const handleConfirm = useCallback(() => {
    setShowConfirm(false)
    useOrderStore.getState().placeLimitOrder(
      market.id,
      market.title,
      side,
      priceNum,
      Math.round(sharesNum),
      contractId,
      'BUY',
    )
    useToastStore.getState().addToast({
      type: 'success',
      message: `限价委托已提交：${side === 'YES' ? '是' : '否'}，${Math.round(sharesNum)} 份，价格 ${fmt(priceNum)} USDC`,
    })
    setPrice('')
    setShares('')
    setTotal('')
    onOrderPlaced?.()
  }, [market, side, priceNum, sharesNum, onOrderPlaced])

  const lastPriceUsdc = market.lastPrice ?? 0.50
  const marketPrice = side === 'YES'
    ? lastPriceUsdc
    : (1 - lastPriceUsdc)

  return (
    <>
      <div className="space-y-3">
        {/* Direction */}
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1.5">方向</label>
          <SegmentedControl
            variant="yes-no"
            options={[
              { id: 'YES', label: '是' },
              { id: 'NO', label: '否' },
            ]}
            value={side}
            onChange={(v) => setSide(v as OrderSide)}
          />
        </div>

        {/* Market price reference */}
        <div className="flex justify-between text-xs">
          <span className="text-[var(--text-secondary)]">市场参考价</span>
          <span className="text-[var(--text-primary)] font-mono">{fmt(marketPrice)} USDC</span>
        </div>

        {/* Price per share */}
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">每份价格</label>
          <div className="flex items-center gap-2 bg-[var(--bg-control)] border border-[var(--border)] rounded-lg px-3 py-2">
            <input
              type="number"
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="0.01 – 0.99"
              className="bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none flex-1 font-mono tabular-nums"
              min="0.01"
              max="0.99"
              step="0.01"
            />
            <span className="text-xs text-[var(--text-secondary)]">USDC</span>
          </div>
        </div>

        {/* Shares */}
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">份额</label>
          <div className="flex items-center gap-2 bg-[var(--bg-control)] border border-[var(--border)] rounded-lg px-3 py-2">
            <input
              type="number"
              value={shares}
              onChange={(e) => handleSharesChange(e.target.value)}
              placeholder="0"
              className="bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none flex-1 font-mono tabular-nums"
              min="1"
              step="1"
            />
            <span className="text-xs text-[var(--text-secondary)]">份</span>
          </div>
          <div className="flex gap-1.5 mt-1.5">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => handlePercentClick(pct)}
                className="flex-1 py-1 text-xs text-[var(--text-secondary)] bg-[var(--bg-base)] rounded hover:bg-[var(--border)] hover:text-[var(--text-primary)] transition-colors"
              >
                {pct === 100 ? '最大' : `${pct}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Total Cost */}
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">总成本</label>
          <div className="flex items-center gap-2 bg-[var(--bg-control)] border border-[var(--border)] rounded-lg px-3 py-2">
            <span className="text-sm text-[var(--text-secondary)]">$</span>
            <input
              type="number"
              value={total}
              onChange={(e) => handleTotalChange(e.target.value)}
              placeholder="0.00"
              className="bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none flex-1 font-mono tabular-nums"
              min="0"
              step="0.01"
            />
            <span className="text-xs text-[var(--text-secondary)]">USDC</span>
          </div>
        </div>

        {/* Available balance */}
        <div className="flex justify-between text-xs">
          <span className="text-[var(--text-secondary)]">可用余额</span>
          <span className="text-[var(--text-primary)] font-mono">{fmt(MOCK_BALANCE)} USDC</span>
        </div>

        {/* Advanced (TIF) */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <span className={`transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▸</span>
          高级设置：{tif}
        </button>
        {showAdvanced && (
          <select
            value={tif}
            onChange={(e) => setTif(e.target.value)}
            className="w-full h-8 px-2 text-xs bg-[var(--bg-control)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[#2DD4BF]"
          >
            <option value="GTC">撤销前有效</option>
            <option value="IOC">立即成交或取消</option>
          </select>
        )}

        {/* Estimate */}
        {isValid && (
          <div className="bg-[var(--bg-base)] rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">预计返还</span>
              <span className="text-[#2DD4BF] font-mono">{fmt(sharesNum * 1)} USDC</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">总成本</span>
              <span className="text-[var(--text-primary)] font-mono">{fmt(priceNum * sharesNum)} USDC</span>
            </div>
            <div className="flex justify-between text-xs border-t border-[var(--border)] pt-1.5">
              <span className="text-[var(--text-secondary)]">预计净盈利</span>
              <span className={`font-mono font-medium ${(sharesNum - priceNum * sharesNum) >= 0 ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'}`}>
                {(sharesNum - priceNum * sharesNum) >= 0 ? '+' : ''}{fmt(sharesNum - priceNum * sharesNum)} USDC
              </span>
            </div>
          </div>
        )}

        <Button
          fullWidth
          variant={side === 'YES' ? 'primary' : 'danger'}
          disabled={!isValid}
          onClick={handleSubmit}
        >
          {isValid
            ? `提交${side === 'YES' ? '是' : '否'}限价委托 — ${Math.round(sharesNum)} 份 @ ${fmt(priceNum)}`
            : '请输入价格和份额'}
        </Button>
      </div>

      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="确认限价委托">
        <div className="space-y-4">
          <div className="space-y-2 text-sm">
            {[
              ['方向', side === 'YES' ? '是' : '否', side === 'YES' ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'],
              ['价格', `${price} USDC`, 'text-[var(--text-primary)]'],
              ['份额', String(Math.round(sharesNum)), 'text-[var(--text-primary)]'],
              ['总成本', `${fmt(priceNum * sharesNum)} USDC`, 'text-[var(--text-primary)]'],
              ['有效期', tif === 'GTC' ? '撤销前有效' : '立即成交或取消', 'text-[var(--text-primary)]'],
            ].map(([label, value, color]) => (
              <div key={label} className="flex justify-between">
                <span className="text-[var(--text-secondary)]">{label}</span>
                <span className={color}>{value}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setShowConfirm(false)}>
              取消
            </Button>
            <Button variant={side === 'YES' ? 'primary' : 'danger'} fullWidth onClick={handleConfirm}>
              确认
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
