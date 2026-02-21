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
  prefillPrice?: number
  prefillSide?: OrderSide
  onOrderPlaced?: () => void
}

export default function LimitOrderPanel({
  market,
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
  const totalNum = parseFloat(total) || 0
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
    )
    useToastStore.getState().addToast({
      type: 'success',
      message: `Limit order placed: ${side} ${Math.round(sharesNum)} @ ${fmt(priceNum)} USDC`,
    })
    setPrice('')
    setShares('')
    setTotal('')
    onOrderPlaced?.()
  }, [market, side, priceNum, sharesNum, onOrderPlaced])

  const lastPriceUsdc = (market.lastPrice ?? 50) / 100
  const marketPrice = side === 'YES'
    ? lastPriceUsdc
    : (1 - lastPriceUsdc)

  return (
    <>
      <div className="space-y-3">
        {/* Direction */}
        <div>
          <label className="block text-xs text-[#8A8A9A] mb-1.5">Direction</label>
          <SegmentedControl
            variant="yes-no"
            options={[
              { id: 'YES', label: 'YES' },
              { id: 'NO', label: 'NO' },
            ]}
            value={side}
            onChange={(v) => setSide(v as OrderSide)}
          />
        </div>

        {/* Market price reference */}
        <div className="flex justify-between text-xs">
          <span className="text-[#8A8A9A]">Market price</span>
          <span className="text-white font-mono">{fmt(marketPrice)} USDC</span>
        </div>

        {/* Price per share */}
        <div>
          <label className="block text-xs text-[#8A8A9A] mb-1">Price per share</label>
          <div className="flex items-center gap-2 bg-[#1C1C28] border border-[#252536] rounded-lg px-3 py-2">
            <input
              type="number"
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="0.01 – 0.99"
              className="bg-transparent text-sm text-white placeholder-[#8A8A9A] outline-none flex-1 font-mono tabular-nums"
              min="0.01"
              max="0.99"
              step="0.01"
            />
            <span className="text-xs text-[#8A8A9A]">USDC</span>
          </div>
        </div>

        {/* Shares */}
        <div>
          <label className="block text-xs text-[#8A8A9A] mb-1">Shares</label>
          <div className="flex items-center gap-2 bg-[#1C1C28] border border-[#252536] rounded-lg px-3 py-2">
            <input
              type="number"
              value={shares}
              onChange={(e) => handleSharesChange(e.target.value)}
              placeholder="0"
              className="bg-transparent text-sm text-white placeholder-[#8A8A9A] outline-none flex-1 font-mono tabular-nums"
              min="1"
              step="1"
            />
            <span className="text-xs text-[#8A8A9A]">shares</span>
          </div>
          <div className="flex gap-1.5 mt-1.5">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => handlePercentClick(pct)}
                className="flex-1 py-1 text-xs text-[#8A8A9A] bg-[#0B0B0F] rounded hover:bg-[#252536] hover:text-white transition-colors"
              >
                {pct === 100 ? 'Max' : `${pct}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Total Cost */}
        <div>
          <label className="block text-xs text-[#8A8A9A] mb-1">Total cost</label>
          <div className="flex items-center gap-2 bg-[#1C1C28] border border-[#252536] rounded-lg px-3 py-2">
            <span className="text-sm text-[#8A8A9A]">$</span>
            <input
              type="number"
              value={total}
              onChange={(e) => handleTotalChange(e.target.value)}
              placeholder="0.00"
              className="bg-transparent text-sm text-white placeholder-[#8A8A9A] outline-none flex-1 font-mono tabular-nums"
              min="0"
              step="0.01"
            />
            <span className="text-xs text-[#8A8A9A]">USDC</span>
          </div>
        </div>

        {/* Available balance */}
        <div className="flex justify-between text-xs">
          <span className="text-[#8A8A9A]">Available</span>
          <span className="text-white font-mono">{fmt(MOCK_BALANCE)} USDC</span>
        </div>

        {/* Advanced (TIF) */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 text-xs text-[#8A8A9A] hover:text-white transition-colors"
        >
          <span className={`transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▸</span>
          Advanced: {tif}
        </button>
        {showAdvanced && (
          <select
            value={tif}
            onChange={(e) => setTif(e.target.value)}
            className="w-full h-8 px-2 text-xs bg-[#1C1C28] text-white border border-[#252536] rounded-lg focus:outline-none focus:border-[#2DD4BF]"
          >
            <option value="GTC">GTC (Good til Cancel)</option>
            <option value="IOC">IOC (Immediate or Cancel)</option>
          </select>
        )}

        {/* Estimate */}
        {isValid && (
          <div className="bg-[#0B0B0F] rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#8A8A9A]">Est. payout</span>
              <span className="text-[#2DD4BF] font-mono">{fmt(sharesNum)} USDC</span>
            </div>
            <div className="flex justify-between text-xs border-t border-[#252536] pt-1.5">
              <span className="text-[#8A8A9A]">Est. profit</span>
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
            ? `Limit ${side} — ${Math.round(sharesNum)} @ ${fmt(priceNum)}`
            : 'Place Limit Order'}
        </Button>
      </div>

      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm Limit Order">
        <div className="space-y-4">
          <div className="space-y-2 text-sm">
            {[
              ['Side', side, side === 'YES' ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'],
              ['Price', `${price} USDC`, 'text-white'],
              ['Shares', String(Math.round(sharesNum)), 'text-white'],
              ['Total', `${fmt(priceNum * sharesNum)} USDC`, 'text-white'],
              ['Time in Force', tif, 'text-white'],
            ].map(([label, value, color]) => (
              <div key={label} className="flex justify-between">
                <span className="text-[#8A8A9A]">{label}</span>
                <span className={color}>{value}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button variant={side === 'YES' ? 'primary' : 'danger'} fullWidth onClick={handleConfirm}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
