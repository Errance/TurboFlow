import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrderStore } from '../stores/orderStore'
import { useToastStore } from '../stores/toastStore'
import Button from './ui/Button'
import Input from './ui/Input'
import SegmentedControl from './ui/SegmentedControl'
import Modal from './ui/Modal'
import Spinner from './ui/Spinner'
import { quickOrderScenarios } from '../data/scenarios'
import type { Market, OrderSide } from '../types'

interface Props {
  market: Market
  className?: string
  onLimitClick?: () => void
}

export default function QuickOrderPanel({ market, className, onLimitClick }: Props) {
  const navigate = useNavigate()
  const [orderMode, setOrderMode] = useState<'Market' | 'Limit'>('Market')
  const [side, setSide] = useState<OrderSide>('YES')
  const [amount, setAmount] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [trackingId, setTrackingId] = useState<string | null>(null)
  const [feedbackTimeout, setFeedbackTimeout] = useState<number | null>(null)

  const orders = useOrderStore((s) => s.orders)
  const trackedOrder = useMemo(
    () => (trackingId ? orders.find((o) => o.id === trackingId) : null),
    [orders, trackingId],
  )

  const isOpen = market.status === 'OPEN'
  const scenario = quickOrderScenarios.find((s) => s.marketId === market.id) ?? quickOrderScenarios[0]

  const handleSubmit = useCallback(() => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return
    setShowConfirm(true)
  }, [amount])

  const handleConfirm = useCallback(() => {
    const qty = Math.round(Number(amount))
    setShowConfirm(false)

    const before = useOrderStore.getState().orders
    useOrderStore.getState().placeQuickOrder(market.id, market.title, side, qty)
    const after = useOrderStore.getState().orders
    const created = after.find((o) => !before.some((b) => b.id === o.id))
    if (created) setTrackingId(created.id)
    setAmount('')
  }, [market, amount, side])

  useEffect(() => {
    if (!trackedOrder) return
    const { status } = trackedOrder
    if (status === 'Filled') {
      useToastStore.getState().addToast({ type: 'success', message: 'Order filled!' })
      setFeedbackTimeout(Date.now() + 5000)
    } else if (status === 'Rejected') {
      useToastStore.getState().addToast({
        type: 'error',
        message: trackedOrder.rejectReason ?? 'Order rejected',
        cta: trackedOrder.rejectCta,
      })
      setFeedbackTimeout(Date.now() + 5000)
    }
  }, [trackedOrder?.status])

  useEffect(() => {
    if (!feedbackTimeout) return
    const t = setTimeout(() => {
      setTrackingId(null)
      setFeedbackTimeout(null)
    }, Math.max(0, feedbackTimeout - Date.now()) + 500)
    return () => clearTimeout(t)
  }, [feedbackTimeout])

  return (
    <>
      <div className={`bg-[#161622] rounded-xl p-4 border border-[#252536] ${className ?? ''}`}>
        {isOpen && onLimitClick && (
          <SegmentedControl
            options={[
              { id: 'Market', label: 'Market' },
              { id: 'Limit', label: 'Limit' },
            ]}
            value={orderMode}
            onChange={(v) => {
              setOrderMode(v as 'Market' | 'Limit')
              if (v === 'Limit') {
                onLimitClick()
                setTimeout(() => setOrderMode('Market'), 0)
              }
            }}
            className="mb-3"
          />
        )}
        {(!isOpen || !onLimitClick) && (
          <h3 className="text-sm font-medium text-white mb-3">Quick Order</h3>
        )}

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
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            suffix="¢"
            disabled={!isOpen}
          />

          <Button
            fullWidth
            variant={side === 'YES' ? 'primary' : 'danger'}
            disabled={!isOpen || !amount || Number(amount) <= 0}
            onClick={handleSubmit}
          >
            {isOpen ? `Buy ${side}` : 'Market Closed'}
          </Button>
        </div>

        {/* Feedback */}
        {trackedOrder && feedbackTimeout && (
          <div className="mt-4 pt-4 border-t border-[#252536]">
            {trackedOrder.status === 'Pending' && (
              <div className="flex items-center gap-2 text-sm text-[#8A8A9A]">
                <Spinner size="sm" />
                <span>Processing...</span>
              </div>
            )}
            {trackedOrder.status === 'PartialFill' && (
              <p className="text-sm text-[#F59E0B]">Partially filled...</p>
            )}
            {trackedOrder.status === 'Filled' && (
              <div className="flex items-center gap-2 text-sm text-[#2DD4BF]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                <span>Order filled!</span>
              </div>
            )}
            {trackedOrder.status === 'Rejected' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-[#E85A7E]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  <span>{trackedOrder.rejectReason ?? 'Rejected'}</span>
                </div>
                {trackedOrder.rejectCta && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      navigate(trackedOrder.rejectCta!.route)
                      setTrackingId(null)
                      setFeedbackTimeout(null)
                    }}
                  >
                    {trackedOrder.rejectCta.label}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm Order">
        <div className="space-y-4">
          <div className="space-y-2 text-sm">
            {[
              ['Side', side, side === 'YES' ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'],
              ['Amount', `${amount}¢`, 'text-white'],
              ['Est. Avg Price', `${scenario.estimatedAvgPrice}¢`, 'text-white'],
              ['Est. Levels', String(scenario.estimatedLevels), 'text-white'],
              ['Est. Fee', `${scenario.estimatedFee}¢`, 'text-white'],
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
