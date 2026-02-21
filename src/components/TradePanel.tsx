import { useState, useCallback, useEffect } from 'react'
import { useEventStore } from '../stores/eventStore'
import { useToastStore } from '../stores/toastStore'
import { useForecastStore } from '../stores/forecastStore'
import type { PredictionEvent, HedgeHint } from '../types'
import Button from './ui/Button'

function formatUsdc(v: number): string {
  return v.toFixed(2)
}

const MOCK_BALANCE = 1000

interface TradeResult {
  side: 'YES' | 'NO'
  price: number
  shares: number
  total: number
  payout: number
  profit: number
  contractLabel: string
}

// ── TradeConfirmModal (detail page only) ────────────────────────

function TradeConfirmModal({
  event,
  result,
  hedgeHints,
  onClose,
}: {
  event: PredictionEvent
  result: TradeResult
  hedgeHints?: HedgeHint[]
  onClose: () => void
}) {
  const addForecast = useForecastStore((s) => s.addForecast)
  const addToast = useToastStore((s) => s.addToast)
  const [phase, setPhase] = useState<'receipt' | 'forecast-input' | 'share'>('receipt')
  const [comment, setComment] = useState('')
  const [forecastId, setForecastId] = useState<string | null>(null)
  const getForecastById = useForecastStore((s) => s.getForecastById)
  const forecast = forecastId ? getForecastById(forecastId) : null

  const handleGenerateForecast = () => {
    setPhase('forecast-input')
  }

  const handleSubmitForecast = () => {
    const contract = event.contracts.find((c) => c.label === result.contractLabel)
    const fc = addForecast({
      eventId: event.id,
      contractId: contract?.id ?? '',
      eventTitle: event.title,
      contractLabel: result.contractLabel,
      side: result.side,
      price: result.price,
      shares: result.shares,
      comment,
      outcomeModel: event.outcomeModel,
      eventStatus: event.status,
    })
    setForecastId(fc.id)
    setPhase('share')
  }

  const handleCopyText = async () => {
    const text = `My prediction on ${event.title}: ${result.side} on "${result.contractLabel}" at ${formatUsdc(result.price)} USDC (${result.shares.toFixed(1)} shares)${comment ? `\n\n${comment}` : ''}\n\nTrade on TurboFlow`
    try {
      await navigator.clipboard.writeText(text)
      addToast({ type: 'success', message: 'Copied to clipboard' })
    } catch {
      addToast({ type: 'error', message: 'Failed to copy' })
    }
  }

  const handleMockShare = (platform: string) => {
    addToast({ type: 'info', message: `${platform} sharing will be available in production` })
  }

  const handleHedge = (hint: HedgeHint) => {
    addToast({ type: 'info', message: `Hedge: ${hint.label} — ${hint.action}` })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#161622] border border-[#252536] rounded-2xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto">
        <div className="p-5">
          {phase === 'receipt' && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-[#2DD4BF]" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="text-lg font-bold text-white">Trade Confirmed</h3>
              </div>
              <div className="bg-[#0B0B0F] rounded-xl p-4 mb-4 space-y-2">
                <p className="text-xs text-[#8A8A9A]">{event.title}</p>
                <p className="text-sm font-medium text-white">{result.contractLabel}</p>
                <div className="flex justify-between text-xs">
                  <span className="text-[#8A8A9A]">Side</span>
                  <span className={result.side === 'YES' ? 'text-[#2DD4BF] font-medium' : 'text-[#E85A7E] font-medium'}>{result.side}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#8A8A9A]">Price</span>
                  <span className="text-white font-mono">{formatUsdc(result.price)} USDC</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#8A8A9A]">Shares</span>
                  <span className="text-white font-mono">{result.shares.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#8A8A9A]">Total cost</span>
                  <span className="text-white font-mono">{formatUsdc(result.total)} USDC</span>
                </div>
                <div className="flex justify-between text-xs border-t border-[#252536] pt-2">
                  <span className="text-[#8A8A9A]">Potential profit</span>
                  <span className="text-[#2DD4BF] font-mono font-medium">+{formatUsdc(result.profit)} USDC</span>
                </div>
              </div>

              {hedgeHints && hedgeHints.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-[#F59E0B] mb-2">Hedge Suggestions</p>
                  <div className="space-y-1.5">
                    {hedgeHints.map((hint, i) => (
                      <button
                        key={i}
                        onClick={() => handleHedge(hint)}
                        className="w-full flex items-center justify-between bg-[#0B0B0F] rounded-lg px-3 py-2 hover:bg-[#252536] transition-colors text-left"
                      >
                        <span className="text-xs text-white">{hint.label}</span>
                        <span className="text-[10px] text-[#8A8A9A]">{hint.action}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onClose} className="flex-1">
                  Close
                </Button>
                <Button variant="primary" size="sm" onClick={handleGenerateForecast} className="flex-1">
                  Generate Forecast Card
                </Button>
              </div>
            </>
          )}

          {phase === 'forecast-input' && (
            <>
              <h3 className="text-lg font-bold text-white mb-1">Your Forecast</h3>
              <p className="text-xs text-[#8A8A9A] mb-4">Add your analysis or reasoning for this trade.</p>
              <div className="bg-[#0B0B0F] rounded-xl p-3 mb-3">
                <p className="text-xs text-[#8A8A9A]">{event.title}</p>
                <p className="text-sm text-white mt-0.5">{result.side} on "{result.contractLabel}" at {formatUsdc(result.price)} USDC</p>
              </div>
              <textarea
                className="w-full bg-[#0B0B0F] border border-[#252536] rounded-lg p-3 text-xs text-white placeholder-[#8A8A9A] focus:outline-none focus:border-[#2DD4BF]/50 resize-none mb-4"
                rows={4}
                placeholder="Share your reasoning — why did you make this trade?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPhase('receipt')} className="flex-1">
                  Back
                </Button>
                <Button variant="primary" size="sm" onClick={handleSubmitForecast} disabled={!comment.trim()} className="flex-1">
                  Create Card
                </Button>
              </div>
            </>
          )}

          {phase === 'share' && forecast && (
            <>
              <h3 className="text-lg font-bold text-white mb-4">Share Your Forecast</h3>
              <div className="bg-gradient-to-br from-[#2DD4BF]/10 to-[#6366F1]/10 border border-[#2DD4BF]/20 rounded-xl p-4 mb-4">
                <p className="text-[10px] text-[#8A8A9A] uppercase tracking-wider mb-2">TurboFlow Forecast</p>
                <p className="text-sm font-medium text-white mb-1">{event.title}</p>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${forecast.side === 'YES' ? 'bg-[#2DD4BF]/20 text-[#2DD4BF]' : 'bg-[#E85A7E]/20 text-[#E85A7E]'}`}>
                    {forecast.side}
                  </span>
                  <span className="text-xs text-white">{forecast.contractLabel}</span>
                  <span className="text-xs text-[#8A8A9A] font-mono">{formatUsdc(forecast.price)} USDC</span>
                </div>
                {forecast.comment && (
                  <p className="text-xs text-[#C0C0D0] italic mb-3">"{forecast.comment}"</p>
                )}
                <div className="w-24 h-24 bg-[#252536] rounded-lg flex items-center justify-center mx-auto mt-2">
                  <span className="text-[10px] text-[#8A8A9A]">QR Code</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <button
                  onClick={handleCopyText}
                  className="w-full flex items-center justify-center gap-2 bg-[#252536] hover:bg-[#2DD4BF]/20 text-white rounded-lg py-2.5 text-sm transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <rect x="5" y="5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                  Copy Text
                </button>
                <button
                  onClick={() => handleMockShare('Save Image')}
                  className="w-full flex items-center justify-center gap-2 bg-[#252536] hover:bg-[#252536]/80 text-[#8A8A9A] rounded-lg py-2.5 text-sm transition-colors"
                >
                  Save Image
                </button>
                <button
                  onClick={() => handleMockShare('Share to X')}
                  className="w-full flex items-center justify-center gap-2 bg-[#252536] hover:bg-[#252536]/80 text-[#8A8A9A] rounded-lg py-2.5 text-sm transition-colors"
                >
                  Share to X
                </button>
              </div>

              <Button variant="ghost" fullWidth size="sm" onClick={onClose}>
                Done
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface TradePanelProps {
  event: PredictionEvent
  context?: 'list' | 'detail'
}

export default function TradePanel({ event, context = 'detail' }: TradePanelProps) {
  const selectedContractId = useEventStore((s) => s.selectedContractId)
  const selectedSide = useEventStore((s) => s.selectedSide)
  const openTradePanel = useEventStore((s) => s.openTradePanel)
  const closeTradePanel = useEventStore((s) => s.closeTradePanel)
  const addToast = useToastStore((s) => s.addToast)

  const contract = event.contracts.find((c) => c.id === selectedContractId)
  const [orderType, setOrderType] = useState<'quick' | 'limit'>('quick')
  const [tradeResult, setTradeResult] = useState<TradeResult | null>(null)

  // Quick Buy state
  const [spendAmount, setSpendAmount] = useState('')

  // Limit Order state
  const [limitPrice, setLimitPrice] = useState('')
  const [limitShares, setLimitShares] = useState('')
  const [limitTotal, setLimitTotal] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [tif, setTif] = useState('GTC')

  const resetFields = useCallback(() => {
    setSpendAmount('')
    setLimitPrice('')
    setLimitShares('')
    setLimitTotal('')
  }, [])

  useEffect(() => {
    resetFields()
  }, [selectedContractId, selectedSide, resetFields])

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

  const isDisabled = event.status !== 'OPEN' || event.statusInfo.subStatus === 'paused'

  // Quick Buy calculations
  const parsedSpend = parseFloat(spendAmount) || 0
  const quickShares = parsedSpend > 0 ? parsedSpend / price : 0
  const quickPayout = quickShares * contract.payoutPerShare
  const quickProfit = quickPayout - parsedSpend

  // Limit Order calculations
  const lPrice = parseFloat(limitPrice) || 0
  const lShares = parseFloat(limitShares) || 0
  const lTotal = parseFloat(limitTotal) || 0
  const limitValid = lPrice > 0 && lPrice <= 0.99 && lShares > 0
  const limitPayout = lShares * contract.payoutPerShare
  const limitProfit = limitPayout - lPrice * lShares

  const handleLimitPriceChange = (val: string) => {
    setLimitPrice(val)
    const p = parseFloat(val) || 0
    if (p > 0 && lShares > 0) {
      setLimitTotal(formatUsdc(p * lShares))
    }
  }

  const handleLimitSharesChange = (val: string) => {
    setLimitShares(val)
    const s = parseFloat(val) || 0
    if (lPrice > 0 && s > 0) {
      setLimitTotal(formatUsdc(lPrice * s))
    }
  }

  const handleLimitTotalChange = (val: string) => {
    setLimitTotal(val)
    const t = parseFloat(val) || 0
    if (lPrice > 0 && t > 0) {
      setLimitShares(Math.floor(t / lPrice).toString())
    }
  }

  const handlePercentClick = (pct: number) => {
    const available = MOCK_BALANCE
    const budget = available * (pct / 100)
    if (lPrice > 0) {
      const shares = Math.floor(budget / lPrice)
      setLimitShares(shares.toString())
      setLimitTotal(formatUsdc(lPrice * shares))
    } else {
      setLimitTotal(formatUsdc(budget))
    }
  }

  const executeTrade = (tradePrice: number, tradeShares: number, tradeTotal: number) => {
    const payout = tradeShares * contract!.payoutPerShare
    const profit = payout - tradeTotal
    const result: TradeResult = {
      side: selectedSide!,
      price: tradePrice,
      shares: tradeShares,
      total: tradeTotal,
      payout,
      profit,
      contractLabel: contract!.label,
    }

    if (context === 'list') {
      addToast({
        type: 'success',
        message: `${selectedSide} ${result.shares.toFixed(1)} shares of "${contract!.label}" at ${formatUsdc(tradePrice)} USDC`,
      })
      resetFields()
      closeTradePanel()
    } else {
      setTradeResult(result)
    }
  }

  const handleQuickBuy = () => {
    if (parsedSpend <= 0) return
    executeTrade(price, quickShares, parsedSpend)
  }

  const handleLimitBuy = () => {
    if (!limitValid) return
    executeTrade(lPrice, lShares, lPrice * lShares)
  }

  return (
    <>
    {tradeResult && (
      <TradeConfirmModal
        event={event}
        result={tradeResult}
        hedgeHints={event.hedgeHints}
        onClose={() => {
          setTradeResult(null)
          resetFields()
        }}
      />
    )}
    <div className="bg-[#161622] border border-[#252536] rounded-xl p-4">
      {/* Header */}
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

      {/* Mutually-exclusive NO context hint */}
      {event.outcomeModel === 'mutually-exclusive' && selectedSide === 'NO' && (
        <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg px-3 py-2 mb-4">
          <p className="text-[10px] text-[#F59E0B]">
            You're betting: NOT "{contract.label}" — you win if any other option is the final result.
          </p>
        </div>
      )}

      {/* Order type tabs */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setOrderType('quick')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            orderType === 'quick'
              ? 'bg-[#252536] text-white'
              : 'text-[#8A8A9A] hover:text-white'
          }`}
        >
          Market
        </button>
        <button
          onClick={() => setOrderType('limit')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            orderType === 'limit'
              ? 'bg-[#252536] text-white'
              : 'text-[#8A8A9A] hover:text-white'
          }`}
        >
          Limit
        </button>
      </div>

      <p className="text-[10px] text-[#8A8A9A] mb-3">
        {orderType === 'quick'
          ? 'Instant fill at current best price'
          : 'Set your own price and wait for a match'}
      </p>

      {/* ========= MARKET ORDER ========= */}
      {orderType === 'quick' && (
        <>
          {/* Market price reference */}
          <div className="flex justify-between text-xs mb-3">
            <span className="text-[#8A8A9A]">Market price</span>
            <span className="text-white font-mono">{formatUsdc(price)} USDC ({probability}%)</span>
          </div>

          {/* Spend input */}
          <div className="mb-4">
            <label className="text-xs text-[#8A8A9A] mb-1 block">Spend (USDC)</label>
            <div className="flex items-center gap-2 bg-[#1C1C28] border border-[#252536] rounded-lg px-3 py-2">
              <span className="text-sm text-[#8A8A9A]">$</span>
              <input
                type="number"
                value={spendAmount}
                onChange={(e) => setSpendAmount(e.target.value)}
                placeholder="0.00"
                className="bg-transparent text-sm text-white placeholder-[#8A8A9A] outline-none flex-1 font-mono tabular-nums"
                min="0"
                step="0.01"
              />
              <span className="text-xs text-[#8A8A9A]">USDC</span>
            </div>
            <div className="flex gap-1.5 mt-2">
              {[10, 25, 50, 100].map((v) => (
                <button
                  key={v}
                  onClick={() => setSpendAmount(String(v))}
                  className="flex-1 py-1 text-xs text-[#8A8A9A] bg-[#0B0B0F] rounded hover:bg-[#252536] hover:text-white transition-colors"
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>

          {/* Estimate breakdown */}
          {parsedSpend > 0 && (
            <div className="bg-[#0B0B0F] rounded-lg p-3 mb-4 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#8A8A9A]">Price per share</span>
                <span className="text-white font-mono">{formatUsdc(price)} USDC</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#8A8A9A]">Est. shares</span>
                <span className="text-white font-mono">{quickShares.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#8A8A9A]">Potential payout</span>
                <span className="text-[#2DD4BF] font-mono">{formatUsdc(quickPayout)} USDC</span>
              </div>
              <div className="flex justify-between text-xs border-t border-[#252536] pt-1.5">
                <span className="text-[#8A8A9A]">Potential profit</span>
                <span className={`font-mono font-medium ${quickProfit >= 0 ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'}`}>
                  {quickProfit >= 0 ? '+' : ''}{formatUsdc(quickProfit)} USDC
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 mb-4">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="#8A8A9A" strokeWidth="1" />
              <path d="M6 3.5v3M6 8.5v0" stroke="#8A8A9A" strokeWidth="1" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] text-[#8A8A9A]">
              Win = 1 USDC/share · Lose = 0 USDC/share
            </span>
          </div>

          <Button
            variant={isYes ? 'primary' : 'danger'}
            fullWidth
            size="lg"
            disabled={isDisabled || parsedSpend <= 0}
            onClick={handleQuickBuy}
          >
            {isDisabled
              ? 'Trading Unavailable'
              : `Buy ${selectedSide} — ${parsedSpend > 0 ? `$${formatUsdc(parsedSpend)}` : 'Enter Amount'}`}
          </Button>
        </>
      )}

      {/* ========= LIMIT ORDER ========= */}
      {orderType === 'limit' && (
        <>
          {/* Market price reference */}
          <div className="flex justify-between text-xs mb-3">
            <span className="text-[#8A8A9A]">Market price</span>
            <span className="text-white font-mono">{formatUsdc(price)} USDC</span>
          </div>

          {/* Price per share */}
          <div className="mb-3">
            <label className="text-xs text-[#8A8A9A] mb-1 block">Price per share</label>
            <div className="flex items-center gap-2 bg-[#1C1C28] border border-[#252536] rounded-lg px-3 py-2">
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => handleLimitPriceChange(e.target.value)}
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
          <div className="mb-3">
            <label className="text-xs text-[#8A8A9A] mb-1 block">Shares</label>
            <div className="flex items-center gap-2 bg-[#1C1C28] border border-[#252536] rounded-lg px-3 py-2">
              <input
                type="number"
                value={limitShares}
                onChange={(e) => handleLimitSharesChange(e.target.value)}
                placeholder="0"
                className="bg-transparent text-sm text-white placeholder-[#8A8A9A] outline-none flex-1 font-mono tabular-nums"
                min="1"
                step="1"
              />
              <span className="text-xs text-[#8A8A9A]">shares</span>
            </div>
            <div className="flex gap-1.5 mt-2">
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
          <div className="mb-3">
            <label className="text-xs text-[#8A8A9A] mb-1 block">Total cost</label>
            <div className="flex items-center gap-2 bg-[#1C1C28] border border-[#252536] rounded-lg px-3 py-2">
              <span className="text-sm text-[#8A8A9A]">$</span>
              <input
                type="number"
                value={limitTotal}
                onChange={(e) => handleLimitTotalChange(e.target.value)}
                placeholder="0.00"
                className="bg-transparent text-sm text-white placeholder-[#8A8A9A] outline-none flex-1 font-mono tabular-nums"
                min="0"
                step="0.01"
              />
              <span className="text-xs text-[#8A8A9A]">USDC</span>
            </div>
          </div>

          {/* Available balance */}
          <div className="flex justify-between text-xs mb-3">
            <span className="text-[#8A8A9A]">Available</span>
            <span className="text-white font-mono">{formatUsdc(MOCK_BALANCE)} USDC</span>
          </div>

          {/* Advanced (TIF) */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-xs text-[#8A8A9A] hover:text-white transition-colors mb-3"
          >
            <span className={`transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▸</span>
            Advanced: {tif}
          </button>
          {showAdvanced && (
            <div className="mb-3">
              <select
                value={tif}
                onChange={(e) => setTif(e.target.value)}
                className="w-full h-8 px-2 text-xs bg-[#1C1C28] text-white border border-[#252536] rounded-lg focus:outline-none focus:border-[#2DD4BF]"
              >
                <option value="GTC">GTC (Good til Cancel)</option>
                <option value="IOC">IOC (Immediate or Cancel)</option>
              </select>
            </div>
          )}

          {/* Estimate breakdown */}
          {limitValid && (
            <div className="bg-[#0B0B0F] rounded-lg p-3 mb-4 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#8A8A9A]">Potential payout</span>
                <span className="text-[#2DD4BF] font-mono">{formatUsdc(limitPayout)} USDC</span>
              </div>
              <div className="flex justify-between text-xs border-t border-[#252536] pt-1.5">
                <span className="text-[#8A8A9A]">Potential profit</span>
                <span className={`font-mono font-medium ${limitProfit >= 0 ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'}`}>
                  {limitProfit >= 0 ? '+' : ''}{formatUsdc(limitProfit)} USDC
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 mb-4">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="#8A8A9A" strokeWidth="1" />
              <path d="M6 3.5v3M6 8.5v0" stroke="#8A8A9A" strokeWidth="1" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] text-[#8A8A9A]">
              Win = 1 USDC/share · Lose = 0 USDC/share
            </span>
          </div>

          <Button
            variant={isYes ? 'primary' : 'danger'}
            fullWidth
            size="lg"
            disabled={isDisabled || !limitValid}
            onClick={handleLimitBuy}
          >
            {isDisabled
              ? 'Trading Unavailable'
              : `Limit ${selectedSide} — ${limitValid ? `${lShares} @ ${formatUsdc(lPrice)}` : 'Enter Price & Shares'}`}
          </Button>
        </>
      )}

      {/* Cancel for mobile */}
      <div className="md:hidden mt-2">
        <Button variant="ghost" fullWidth size="sm" onClick={closeTradePanel}>
          Cancel
        </Button>
      </div>
    </div>
    </>
  )
}
