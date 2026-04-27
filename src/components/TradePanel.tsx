import { useState, useCallback, useEffect } from 'react'
import { useEventStore } from '../stores/eventStore'
import { useToastStore } from '../stores/toastStore'
import { useOrderStore } from '../stores/orderStore'
import type { PredictionEvent } from '../types'
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
  onClose,
  onBuyMore,
}: {
  event: PredictionEvent
  result: TradeResult
  onClose: () => void
  onBuyMore: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6 text-[#2DD4BF]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">交易已确认</h3>
          </div>
          <div className="bg-[var(--bg-base)] rounded-xl p-4 mb-4 space-y-2">
            <p className="text-xs text-[var(--text-secondary)]">{event.title}</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">{result.contractLabel}</p>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">方向</span>
              <span className={result.side === 'YES' ? 'text-[#2DD4BF] font-medium' : 'text-[#E85A7E] font-medium'}>{result.side === 'YES' ? '是' : '否'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">价格</span>
              <span className="text-[var(--text-primary)] font-mono">{formatUsdc(result.price)} USDC</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">份额</span>
              <span className="text-[var(--text-primary)] font-mono">{result.shares.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">总成本</span>
              <span className="text-[var(--text-primary)] font-mono">{formatUsdc(result.total)} USDC</span>
            </div>
            <div className="flex justify-between text-xs border-t border-[var(--border)] pt-2">
              <span className="text-[var(--text-secondary)]">可能净盈利</span>
              <span className="text-[#2DD4BF] font-mono font-medium">+{formatUsdc(result.profit)} USDC</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" fullWidth size="sm" onClick={onBuyMore}>
              继续买入
            </Button>
            <Button variant="primary" fullWidth size="sm" onClick={onClose}>
              完成
            </Button>
          </div>
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
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
        <p className="text-sm text-[var(--text-secondary)] text-center py-8">
          请选择合约的“是”或“否”后开始交易。
        </p>
      </div>
    )
  }

  const isYes = selectedSide === 'YES'
  const selectedSideLabel = isYes ? '是' : '否'
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

  const handleQuickBuy = () => {
    if (parsedSpend <= 0) return
    const tradeShares = quickShares
    const tradePrice = price
    const tradeTotal = parsedSpend
    const payout = tradeShares * contract!.payoutPerShare
    const profit = payout - tradeTotal

    useOrderStore.getState().placeMarketOrder({
      contractId: contract!.id,
      marketTitle: `${event.title} — ${contract!.label}`,
      side: selectedSide!,
      action: 'BUY',
      price: tradePrice,
      quantity: Math.round(tradeShares),
    })

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
        message: `已买入 ${result.shares.toFixed(1)} 份“${contract!.label} - ${selectedSideLabel}”，成交价 ${formatUsdc(tradePrice)} USDC`,
      })
      resetFields()
      closeTradePanel()
    } else {
      setTradeResult(result)
    }
  }

  const handleLimitBuy = () => {
    if (!limitValid) return

    useOrderStore.getState().placeLimitOrder(
      contract!.id,
      `${event.title} — ${contract!.label}`,
      selectedSide!,
      lPrice,
      lShares,
      contract!.id,
      'BUY',
    )

    if (context === 'list') {
      addToast({
        type: 'success',
        message: `限价委托已提交：${selectedSideLabel}，${lShares} 份，价格 ${formatUsdc(lPrice)} USDC`,
      })
      resetFields()
      closeTradePanel()
    } else {
      addToast({
        type: 'success',
        message: '限价委托已提交，可在资产页查看',
      })
      resetFields()
    }
  }

  return (
    <>
    {tradeResult && (
      <TradeConfirmModal
        event={event}
        result={tradeResult}
        onClose={() => {
          setTradeResult(null)
          resetFields()
        }}
        onBuyMore={() => {
          setTradeResult(null)
          resetFields()
        }}
      />
    )}
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
      {/* Header */}
      <div className="mb-4">
        <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">交易</p>
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{event.title}</p>
        <p className="text-xs text-[var(--text-secondary)] truncate">{contract.label}</p>
      </div>

      {/* Side selector */}
      <div className="flex gap-1 mb-4 bg-[var(--bg-base)] rounded-lg p-0.5">
        <button
          onClick={() => openTradePanel(contract.id, 'YES')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            isYes ? 'bg-[#2DD4BF] text-[#0B0B0F]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          是 {contract.probability}%
        </button>
        <button
          onClick={() => openTradePanel(contract.id, 'NO')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            !isYes ? 'bg-[#E85A7E] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          否 {Math.round((1 - contract.yesPrice) * 100)}%
        </button>
      </div>

      {/* Mutually-exclusive NO context hint */}
      {event.outcomeModel === 'mutually-exclusive' && selectedSide === 'NO' && (
        <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg px-3 py-2 mb-4">
          <p className="text-[10px] text-[#F59E0B]">
            当前选择为“非 {contract.label}”。如果最终结果为其他任一选项，则该选择结算为赢。
          </p>
        </div>
      )}

      {/* Order type tabs */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setOrderType('quick')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            orderType === 'quick'
              ? 'bg-[var(--border)] text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          市价
        </button>
        <button
          onClick={() => setOrderType('limit')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            orderType === 'limit'
              ? 'bg-[var(--border)] text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          限价
        </button>
      </div>

      <p className="text-[10px] text-[var(--text-secondary)] mb-3">
        {orderType === 'quick'
          ? '按当前最优价格立即成交。'
          : '自行设置价格，等待市场成交。'}
      </p>

      {/* ========= MARKET ORDER ========= */}
      {orderType === 'quick' && (
        <>
          {/* Est. execution price */}
          <div className="flex justify-between text-xs mb-3">
            <span className="text-[var(--text-secondary)]">预计成交价</span>
            <span className="text-[var(--text-primary)] font-mono">
              {formatUsdc(price)} USDC ({probability}%)
              {contract.change24h !== 0 && (
                <span className={`ml-1.5 ${contract.change24h > 0 ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'}`}>
                  {contract.change24h > 0 ? '+' : ''}{contract.change24h}%
                </span>
              )}
            </span>
          </div>

          {/* Spend input */}
          <div className="mb-4">
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">买入金额（USDC）</label>
            <div className="flex items-center gap-2 bg-[var(--bg-control)] border border-[var(--border)] rounded-lg px-3 py-2">
              <span className="text-sm text-[var(--text-secondary)]">$</span>
              <input
                type="number"
                value={spendAmount}
                onChange={(e) => setSpendAmount(e.target.value)}
                placeholder="0.00"
                className="bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none flex-1 font-mono tabular-nums"
                min="0"
                step="0.01"
              />
              <span className="text-xs text-[var(--text-secondary)]">USDC</span>
            </div>
            <div className="flex gap-1.5 mt-2">
              {[10, 25, 50, 100].map((v) => (
                <button
                  key={v}
                  onClick={() => setSpendAmount(String(v))}
                  className="flex-1 py-2 min-h-[36px] text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-base)] rounded hover:bg-[var(--border)] hover:text-[var(--text-primary)] transition-colors"
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>

          {/* Estimate breakdown */}
          {parsedSpend > 0 && (
            <div className="bg-[var(--bg-base)] rounded-lg p-3 mb-4 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">每份价格</span>
                <span className="text-[var(--text-primary)] font-mono">{formatUsdc(price)} USDC</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">预计份额</span>
                <span className="text-[var(--text-primary)] font-mono">{quickShares.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">可能返还</span>
                <span className="text-[#2DD4BF] font-mono">{formatUsdc(quickPayout)} USDC</span>
              </div>
              <div className="flex justify-between text-xs border-t border-[var(--border)] pt-1.5">
                <span className="text-[var(--text-secondary)]">可能净盈利</span>
                <span className={`font-mono font-medium ${quickProfit >= 0 ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'}`}>
                  {quickProfit >= 0 ? '+' : ''}{formatUsdc(quickProfit)} USDC
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 mb-4">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="var(--text-secondary)" strokeWidth="1" />
              <path d="M6 3.5v3M6 8.5v0" stroke="var(--text-secondary)" strokeWidth="1" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] text-[var(--text-secondary)]">
              命中按 1 USDC / 份结算，未命中按 0 USDC / 份结算
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
              ? '当前不可交易'
              : `买入${selectedSideLabel} — ${parsedSpend > 0 ? `${formatUsdc(parsedSpend)} USDC` : '请输入金额'}`}
          </Button>
        </>
      )}

      {/* ========= LIMIT ORDER ========= */}
      {orderType === 'limit' && (
        <>
          {/* Est. execution price */}
          <div className="flex justify-between text-xs mb-3">
            <span className="text-[var(--text-secondary)]">参考成交价</span>
            <span className="text-[var(--text-primary)] font-mono">
              {formatUsdc(price)} USDC
              {contract.change24h !== 0 && (
                <span className={`ml-1.5 ${contract.change24h > 0 ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'}`}>
                  {contract.change24h > 0 ? '+' : ''}{contract.change24h}%
                </span>
              )}
            </span>
          </div>

          {/* Price per share */}
          <div className="mb-3">
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">每份价格</label>
            <div className="flex items-center gap-2 bg-[var(--bg-control)] border border-[var(--border)] rounded-lg px-3 py-2">
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => handleLimitPriceChange(e.target.value)}
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
          <div className="mb-3">
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">份额</label>
            <div className="flex items-center gap-2 bg-[var(--bg-control)] border border-[var(--border)] rounded-lg px-3 py-2">
              <input
                type="number"
                value={limitShares}
                onChange={(e) => handleLimitSharesChange(e.target.value)}
                placeholder="0"
                className="bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none flex-1 font-mono tabular-nums"
                min="1"
                step="1"
              />
              <span className="text-xs text-[var(--text-secondary)]">份</span>
            </div>
            <div className="flex gap-1.5 mt-2">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => handlePercentClick(pct)}
                  className="flex-1 py-2 min-h-[36px] text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-base)] rounded hover:bg-[var(--border)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {pct === 100 ? '最大' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Total Cost */}
          <div className="mb-3">
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">总成本</label>
            <div className="flex items-center gap-2 bg-[var(--bg-control)] border border-[var(--border)] rounded-lg px-3 py-2">
              <span className="text-sm text-[var(--text-secondary)]">$</span>
              <input
                type="number"
                value={limitTotal}
                onChange={(e) => handleLimitTotalChange(e.target.value)}
                placeholder="0.00"
                className="bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none flex-1 font-mono tabular-nums"
                min="0"
                step="0.01"
              />
              <span className="text-xs text-[var(--text-secondary)]">USDC</span>
            </div>
          </div>

          {/* Available balance */}
          <div className="flex justify-between text-xs mb-3">
            <span className="text-[var(--text-secondary)]">可用余额</span>
            <span className="text-[var(--text-primary)] font-mono">{formatUsdc(MOCK_BALANCE)} USDC</span>
          </div>

          {/* Advanced (TIF) */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-3"
          >
            <span className={`transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▸</span>
            高级设置：{tif}
          </button>
          {showAdvanced && (
            <div className="mb-3">
              <select
                value={tif}
                onChange={(e) => setTif(e.target.value)}
                className="w-full h-8 px-2 text-xs bg-[var(--bg-control)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[#2DD4BF]"
              >
                <option value="GTC">撤销前有效</option>
                <option value="IOC">立即成交或取消</option>
              </select>
            </div>
          )}

          {/* Estimate breakdown */}
          {limitValid && (
            <div className="bg-[var(--bg-base)] rounded-lg p-3 mb-4 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">可能返还</span>
                <span className="text-[#2DD4BF] font-mono">{formatUsdc(limitPayout)} USDC</span>
              </div>
              <div className="flex justify-between text-xs border-t border-[var(--border)] pt-1.5">
                <span className="text-[var(--text-secondary)]">可能净盈利</span>
                <span className={`font-mono font-medium ${limitProfit >= 0 ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'}`}>
                  {limitProfit >= 0 ? '+' : ''}{formatUsdc(limitProfit)} USDC
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 mb-4">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="var(--text-secondary)" strokeWidth="1" />
              <path d="M6 3.5v3M6 8.5v0" stroke="var(--text-secondary)" strokeWidth="1" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] text-[var(--text-secondary)]">
              命中按 1 USDC / 份结算，未命中按 0 USDC / 份结算
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
              ? '当前不可交易'
              : `提交${selectedSideLabel}限价委托 — ${limitValid ? `${lShares} 份 @ ${formatUsdc(lPrice)}` : '请输入价格和份额'}`}
          </Button>
        </>
      )}

      {/* Cancel for mobile */}
      <div className="md:hidden mt-2">
        <Button variant="ghost" fullWidth size="sm" onClick={closeTradePanel}>
          取消
        </Button>
      </div>
    </div>
    </>
  )
}
