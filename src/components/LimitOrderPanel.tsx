import { useState, useCallback } from 'react'
import { useOrderStore } from '../stores/orderStore'
import { useToastStore } from '../stores/toastStore'
import Button from './ui/Button'
import Input from './ui/Input'
import SegmentedControl from './ui/SegmentedControl'
import Modal from './ui/Modal'
import type { Market, OrderSide } from '../types'

interface Props {
  market: Market
  prefillPrice?: number
  prefillSide?: OrderSide
  onOrderPlaced?: () => void
}

const TIF_OPTIONS = [
  { value: 'GTC', label: 'GTC (Good til Cancel)' },
  { value: 'IOC', label: 'IOC (Immediate or Cancel)' },
]

export default function LimitOrderPanel({
  market,
  prefillPrice,
  prefillSide,
  onOrderPlaced,
}: Props) {
  const [side, setSide] = useState<OrderSide>(prefillSide ?? 'YES')
  const [price, setPrice] = useState(prefillPrice?.toString() ?? '')
  const [quantity, setQuantity] = useState('')
  const [tif, setTif] = useState('GTC')
  const [showConfirm, setShowConfirm] = useState(false)

  const priceNum = Number(price)
  const qtyNum = Math.round(Number(quantity))
  const isValid =
    price !== '' &&
    !isNaN(priceNum) &&
    priceNum > 0 &&
    priceNum <= 99 &&
    quantity !== '' &&
    !isNaN(qtyNum) &&
    qtyNum > 0

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
      qtyNum,
    )
    useToastStore.getState().addToast({
      type: 'success',
      message: `Limit order placed: ${side} ${qtyNum} @ ${priceNum}¢`,
    })
    setPrice('')
    setQuantity('')
    onOrderPlaced?.()
  }, [market, side, priceNum, qtyNum, onOrderPlaced])

  const estTotal = isValid ? ((priceNum * qtyNum) / 100).toFixed(2) : '—'

  return (
    <>
      <div className="space-y-4">
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

        <Input
          label="Price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="1 – 99"
          suffix="¢"
        />

        <Input
          label="Quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0"
        />

        <div>
          <label className="block text-xs text-[#8A8A9A] mb-1.5">Time in Force</label>
          <select
            value={tif}
            onChange={(e) => setTif(e.target.value)}
            className="w-full h-10 px-3 text-sm bg-[#1C1C28] text-white border border-[#252536] rounded-lg focus:outline-none focus:border-[#2DD4BF]"
          >
            {TIF_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {isValid && (
          <div className="flex justify-between text-xs text-[#8A8A9A]">
            <span>Est. Total</span>
            <span className="font-mono tabular-nums text-white">${estTotal}</span>
          </div>
        )}

        <Button
          fullWidth
          variant={side === 'YES' ? 'primary' : 'danger'}
          disabled={!isValid}
          onClick={handleSubmit}
        >
          Place Limit Order
        </Button>
      </div>

      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm Limit Order">
        <div className="space-y-4">
          <div className="space-y-2 text-sm">
            {[
              ['Side', side, side === 'YES' ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'],
              ['Price', `${price}¢`, 'text-white'],
              ['Quantity', String(qtyNum), 'text-white'],
              ['Time in Force', tif, 'text-white'],
              ['Est. Total', `$${estTotal}`, 'text-white'],
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
