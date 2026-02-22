import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { useStrategyStore } from '../stores/strategyStore'
import { useToastStore } from '../stores/toastStore'
import { evaluateStrategy } from '../lib/strategyMath'
import type { TrenchStance } from '../types'

function fmtUsdc(v: number): string {
  return `${v.toFixed(2)} USDC`
}

export default function StrategyDetailPage() {
  const { strategyId } = useParams<{ strategyId: string }>()
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)

  const getTemplate = useStrategyStore((s) => s.getTemplate)
  const getTemplatesByBasket = useStrategyStore((s) => s.getTemplatesByBasket)
  const getMessagesByBasket = useStrategyStore((s) => s.getMessagesByBasket)
  const getInstancesByTemplate = useStrategyStore((s) => s.getInstancesByTemplate)
  const copyTemplate = useStrategyStore((s) => s.copyTemplate)
  const updateInstanceWeights = useStrategyStore((s) => s.updateInstanceWeights)
  const addTrenchMessage = useStrategyStore((s) => s.addTrenchMessage)

  const template = getTemplate(strategyId ?? '')

  const myInstances = useMemo(
    () => (template ? getInstancesByTemplate(template.id, 'You') : []),
    [getInstancesByTemplate, template],
  )
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('')
  const currentInstance =
    myInstances.find((item) => item.id === selectedInstanceId) ?? myInstances[0]
  const activeLegs = currentInstance?.legs ?? template?.legs ?? []
  const notional = currentInstance?.notional ?? 100
  const valuation = evaluateStrategy(activeLegs, notional)

  const [newMessage, setNewMessage] = useState('')
  const [stance, setStance] = useState<TrenchStance>('support')

  if (!template) {
    return (
      <div className="px-4 md:px-6 py-12 text-center">
        <p className="text-[#8A8A9A]">Strategy not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/strategies')}>
          Back to Strategies
        </Button>
      </div>
    )
  }

  const sameBasketVariants = getTemplatesByBasket(template.basketId).filter(
    (item) => item.id !== template.id,
  )
  const trenchMessages = getMessagesByBasket(template.basketId)

  const updateWeight = (legId: string, nextWeight: number) => {
    if (!currentInstance) return
    const nextMap: Record<string, number> = {}
    currentInstance.legs.forEach((leg) => {
      nextMap[leg.id] = leg.id === legId ? nextWeight : leg.weight
    })
    updateInstanceWeights(currentInstance.id, nextMap)
  }

  return (
    <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <button
            className="text-xs text-[#8A8A9A] hover:text-white transition-colors mb-1"
            onClick={() => navigate('/strategies')}
          >
            ← Back to Strategies
          </button>
          <h1 className="text-xl font-bold text-white">{template.title}</h1>
          <p className="text-xs text-[#8A8A9A] mt-1">
            by {template.createdBy} · Basket signature based on contract+side · No DEX hedge entry in strategy baskets
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Badge variant={template.thesis ? 'success' : 'neutral'}>
            {template.thesis ? 'With Thesis' : 'Thesis Skipped'}
          </Badge>
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              const instance = copyTemplate({
                templateId: template.id,
                userName: 'You',
                notional: 100,
              })
              if (!instance) {
                addToast({ type: 'error', message: 'Unable to copy strategy' })
                return
              }
              setSelectedInstanceId(instance.id)
              addToast({ type: 'success', message: 'Strategy copied. You can now adjust weights.' })
            }}
          >
            Copy Strategy
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        <Card>
          <p className="text-xs text-[#8A8A9A] mb-1">Notional</p>
          <p className="text-lg font-semibold text-white">{fmtUsdc(notional)}</p>
        </Card>
        <Card>
          <p className="text-xs text-[#8A8A9A] mb-1">Entry Cost</p>
          <p className="text-lg font-semibold text-white">{fmtUsdc(valuation.entryCost)}</p>
        </Card>
        <Card>
          <p className="text-xs text-[#8A8A9A] mb-1">Mark Value</p>
          <p className="text-lg font-semibold text-white">{fmtUsdc(valuation.markValue)}</p>
        </Card>
        <Card>
          <p className="text-xs text-[#8A8A9A] mb-1">PnL</p>
          <p
            className={`text-lg font-semibold ${
              valuation.pnl >= 0 ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'
            }`}
          >
            {valuation.pnl >= 0 ? '+' : ''}
            {valuation.pnl.toFixed(2)} USDC ({valuation.pnlPercent >= 0 ? '+' : ''}
            {valuation.pnlPercent.toFixed(2)}%)
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Basket Legs</h2>
              <span className="text-[11px] text-[#8A8A9A] font-mono">{template.basketId}</span>
            </div>
            {currentInstance && myInstances.length > 1 && (
              <div className="mb-3">
                <label className="text-xs text-[#8A8A9A] mr-2">My Instance</label>
                <select
                  value={currentInstance.id}
                  onChange={(e) => setSelectedInstanceId(e.target.value)}
                  className="bg-[#1C1C28] border border-[#252536] rounded-lg px-2 py-1 text-xs text-white"
                >
                  {myInstances.map((item, idx) => (
                    <option key={item.id} value={item.id}>
                      Instance {myInstances.length - idx} · {fmtUsdc(item.notional)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              {valuation.metrics.map((leg) => (
                <div key={leg.legId} className="bg-[#0B0B0F] border border-[#252536] rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{leg.label}</p>
                      <p className="text-[11px] text-[#8A8A9A] truncate">{leg.eventTitle}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-semibold ${
                          leg.side === 'YES' ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'
                        }`}
                      >
                        {leg.side}
                      </span>
                      <p className="text-[11px] text-[#8A8A9A]">{leg.status}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono tabular-nums mb-2">
                    <div>
                      <p className="text-[#8A8A9A]">Entry</p>
                      <p className="text-white">{leg.entryPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[#8A8A9A]">Mark</p>
                      <p className="text-white">{leg.markPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[#8A8A9A]">Weight</p>
                      <p className="text-white">{(leg.weight * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  {currentInstance && (
                    <div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={Math.round(leg.weight * 100)}
                        onChange={(e) => updateWeight(leg.legId, Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {valuation.settledValue !== undefined && (
              <div className="mt-3 text-xs text-[#8A8A9A]">
                Settled Value: <span className="text-white font-mono">{fmtUsdc(valuation.settledValue)}</span>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-white mb-2">Strategy Thesis</h2>
            <p className="text-xs text-[#8A8A9A] leading-relaxed">
              {template.thesis?.trim()
                ? template.thesis
                : 'Author skipped written thesis. This strategy is still copyable and can be discussed in the trench.'}
            </p>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-white mb-3">Strategy Trench</h2>
            <div className="space-y-2 mb-4 max-h-[320px] overflow-y-auto pr-1">
              {trenchMessages.length === 0 && (
                <p className="text-xs text-[#8A8A9A]">No discussion yet.</p>
              )}
              {trenchMessages.map((msg) => (
                <div key={msg.id} className="bg-[#0B0B0F] rounded-lg p-3 border border-[#252536]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white font-medium">{msg.author}</span>
                    <span className="text-[10px] text-[#8A8A9A]">
                      {new Date(msg.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-[#8A8A9A] mb-1">{msg.body}</p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        msg.stance === 'support'
                          ? 'success'
                          : msg.stance === 'oppose'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {msg.stance}
                    </Badge>
                    <span className="text-[10px] text-[#8A8A9A]">Votes {msg.votes}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={stance}
                  onChange={(e) => setStance(e.target.value as TrenchStance)}
                  className="bg-[#1C1C28] border border-[#252536] rounded-lg px-2 py-2 text-xs text-white"
                >
                  <option value="support">support</option>
                  <option value="oppose">oppose</option>
                  <option value="adjust">adjust</option>
                </select>
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Share your stance on this basket..."
                  className="flex-1 bg-[#1C1C28] border border-[#252536] rounded-lg px-3 py-2 text-xs text-white placeholder-[#8A8A9A] outline-none"
                />
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (!newMessage.trim()) return
                  addTrenchMessage({
                    basketId: template.basketId,
                    author: 'You',
                    body: newMessage,
                    stance,
                  })
                  setNewMessage('')
                }}
              >
                Post to Trench
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-white mb-2">Same Basket Variants</h3>
            {sameBasketVariants.length === 0 ? (
              <p className="text-xs text-[#8A8A9A]">No other templates use this basket yet.</p>
            ) : (
              <div className="space-y-2">
                {sameBasketVariants.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/strategy/${item.id}`)}
                    className="w-full text-left bg-[#0B0B0F] border border-[#252536] rounded-lg p-3 hover:border-[#2DD4BF]/40 transition-colors"
                  >
                    <p className="text-xs text-white font-medium truncate">{item.title}</p>
                    <p className="text-[11px] text-[#8A8A9A] mt-0.5">
                      {item.copyCount} copies · by {item.createdBy}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-white mb-2">Workflow Hint</h3>
            <p className="text-xs text-[#8A8A9A] leading-relaxed">
              Same basket + different weights stays in the same strategy trench. Changing side or adding/removing a leg
              creates a new basket signature.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
