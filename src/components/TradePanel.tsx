import { useState } from 'react'
import { useEventStore } from '../stores/eventStore'
import type { PredictionEvent } from '../types'
import Button from './ui/Button'
import Badge from './ui/Badge'

function formatUsdc(v: number): string {
  return v.toFixed(2)
}

interface TradePanelProps {
  event: PredictionEvent
}

export default function TradePanel({ event }: TradePanelProps) {
  const selectedContractId = useEventStore((s) => s.selectedContractId)
  const selectedSide = useEventStore((s) => s.selectedSide)
  const openTradePanel = useEventStore((s) => s.openTradePanel)
  const closeTradePanel = useEventStore((s) => s.closeTradePanel)

  const contract = event.contracts.find((c) => c.id === selectedContractId)
  const [amount, setAmount] = useState('')
  const [orderType, setOrderType] = useState<'quick' | 'limit'>('quick')

  if (!contract || !selectedSide) {
    return (
      <div className="bg-[#161622] border border-[#252536] rounded-xl p-4">
        <p className="text-sm text-[#8A8A9A] text-center py-8">
          Select a contract's Yes or No button to start trading
        </p>
      </div>
    )
  }

  const isYes = selectedSide === 'YES'
  const price = isYes ? contract.yesPrice : contract.noPrice
  const probability = isYes ? contract.probability : Math.round((1 - contract.yesPrice) * 100)
  const parsedAmount = parseFloat(amount) || 0
  const shares = parsedAmount > 0 ? parsedAmount / price : 0
  const potentialPayout = shares * contract.payoutPerShare
  const potentialProfit = potentialPayout - parsedAmount

  const isDisabled = event.status !== 'OPEN' || event.statusInfo.subStatus === 'paused'

  return (
    <div className="bg-[#161622] border border-[#252536] rounded-xl p-4">
      {/* Self-explanation header */}
      <div className="mb-4">
        <p className="text-[10px] text-[#8A8A9A] uppercase tracking-wider mb-1">Trading</p>
        <p className="text-sm font-medium text-white truncate">{event.title}</p>
        <p className="text-xs text-[#8A8A9A] truncate">{contract.label}</p>
      </div>

      {/* Side selector */}
      <div className="flex gap-1 mb-4 bg-[#0B0B0F] rounded-lg p-0.5">
        <button
          onClick={() => openTradePanel(contract.id, 'YES')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            isYes ? 'bg-[#2DD4BF] text-[#0B0B0F]' : 'text-[#8A8A9A] hover:text-white'
          }`}
        >
          Yes {contract.probability}%
        </button>
        <button
          onClick={() => openTradePanel(contract.id, 'NO')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            !isYes ? 'bg-[#E85A7E] text-white' : 'text-[#8A8A9A] hover:text-white'
          }`}
        >
          No {Math.round((1 - contract.yesPrice) * 100)}%
        </button>
      </div>

      {/* Order type */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setOrderType('quick')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            orderType === 'quick'
              ? 'bg-[#252536] text-white'
              : 'text-[#8A8A9A] hover:text-white'
          }`}
        >
          Quick Buy
        </button>
        <button
          onClick={() => setOrderType('limit')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            orderType === 'limit'
              ? 'bg-[#252536] text-white'
              : 'text-[#8A8A9A] hover:text-white'
          }`}
        >
          Limit Order
        </button>
      </div>

      {/* Quick Buy / Limit explanation */}
      <p className="text-[10px] text-[#8A8A9A] mb-3">
        {orderType === 'quick'
          ? 'Instant fill at current best price'
          : 'Set your own price and wait for a match (CLOB)'}
      </p>

      {/* Amount input */}
      <div className="mb-4">
        <label className="text-xs text-[#8A8A9A] mb-1 block">Amount (USDC)</label>
        <div className="flex items-center gap-2 bg-[#1C1C28] border border-[#252536] rounded-lg px-3 py-2">
          <span className="text-sm text-[#8A8A9A]">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="bg-transparent text-sm text-white placeholder-[#8A8A9A] outline-none flex-1 font-mono tabular-nums"
            min="0"
            step="0.01"
          />
          <span className="text-xs text-[#8A8A9A]">USDC</span>
        </div>
        {/* Quick amounts */}
        <div className="flex gap-1.5 mt-2">
          {[10, 25, 50, 100].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(String(v))}
              className="flex-1 py-1 text-xs text-[#8A8A9A] bg-[#0B0B0F] rounded hover:bg-[#252536] hover:text-white transition-colors"
            >
              ${v}
            </button>
          ))}
        </div>
      </div>

      {/* Estimate breakdown */}
      {parsedAmount > 0 && (
        <div className="bg-[#0B0B0F] rounded-lg p-3 mb-4 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[#8A8A9A]">Price per share</span>
            <span className="text-white font-mono">{formatUsdc(price)} USDC</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#8A8A9A]">Shares</span>
            <span className="text-white font-mono">{shares.toFixed(1)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#8A8A9A]">Potential payout</span>
            <span className="text-[#2DD4BF] font-mono">{formatUsdc(potentialPayout)} USDC</span>
          </div>
          <div className="flex justify-between text-xs border-t border-[#252536] pt-1.5">
            <span className="text-[#8A8A9A]">Potential profit</span>
            <span className={`font-mono font-medium ${potentialProfit >= 0 ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'}`}>
              {potentialProfit >= 0 ? '+' : ''}{formatUsdc(potentialProfit)} USDC
            </span>
          </div>
        </div>
      )}

      {/* Payout reminder */}
      <div className="flex items-center gap-1.5 mb-4">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="#8A8A9A" strokeWidth="1" />
          <path d="M6 3.5v3M6 8.5v0" stroke="#8A8A9A" strokeWidth="1" strokeLinecap="round" />
        </svg>
        <span className="text-[10px] text-[#8A8A9A]">
          Win = 1 USDC/share · Lose = 0 USDC/share
        </span>
      </div>

      {/* Confirm button */}
      <Button
        variant={isYes ? 'primary' : 'danger'}
        fullWidth
        size="lg"
        disabled={isDisabled || parsedAmount <= 0}
      >
        {isDisabled
          ? 'Trading Unavailable'
          : `Buy ${selectedSide} — ${parsedAmount > 0 ? `$${formatUsdc(parsedAmount)}` : 'Enter Amount'}`}
      </Button>

      {/* Cancel for mobile */}
      <div className="md:hidden mt-2">
        <Button variant="ghost" fullWidth size="sm" onClick={closeTradePanel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
