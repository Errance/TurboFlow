import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { useEventStore } from '../stores/eventStore'
import { useStrategyStore, buildBasketId } from '../stores/strategyStore'
import { useToastStore } from '../stores/toastStore'
import { useForecastStore } from '../stores/forecastStore'
import type { OrderSide } from '../types'

interface DraftLeg {
  id: string
  contractId: string
  side: OrderSide
  weight: number
}

interface ContractOption {
  contractId: string
  eventId: string
  eventTitle: string
  contractLabel: string
  status: string
  volume: number
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function legKey(contractId: string, side: OrderSide): string {
  return `${contractId}:${side}`
}

const STATUS_RANK: Record<string, number> = {
  OPEN: 0,
  CLOSED: 1,
  RESOLVING: 2,
  SETTLED: 3,
  CANCELLED: 4,
  VOIDED: 5,
}

export default function CreateStrategyPage() {
  const navigate = useNavigate()
  const events = useEventStore((s) => s.events)
  const createTemplate = useStrategyStore((s) => s.createTemplate)
  const forecasts = useForecastStore((s) => s.forecasts)
  const addToast = useToastStore((s) => s.addToast)

  const [title, setTitle] = useState('')
  const [creator, setCreator] = useState('You')
  const [driverEventId, setDriverEventId] = useState('')
  const [thesis, setThesis] = useState('')
  const [tags, setTags] = useState('')

  const contractOptions = useMemo<ContractOption[]>(() => {
    return events
      .filter((event) => event.type !== 'instant')
      .flatMap((event) =>
        event.contracts.map((contract) => ({
          contractId: contract.id,
          eventId: event.id,
          eventTitle: event.title,
          contractLabel: contract.label,
          status: contract.status,
          volume: contract.volume,
        })),
      )
      .sort((a, b) => {
        const statusDiff = (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99)
        if (statusDiff !== 0) return statusDiff
        return b.volume - a.volume
      })
  }, [events])

  const optionMap = useMemo(() => {
    const map: Record<string, ContractOption> = {}
    contractOptions.forEach((item) => {
      map[item.contractId] = item
    })
    return map
  }, [contractOptions])

  const [contractQuery, setContractQuery] = useState('')
  const filteredContractOptions = useMemo(() => {
    const q = contractQuery.trim().toLowerCase()
    if (!q) return contractOptions
    return contractOptions.filter((item) =>
      item.eventTitle.toLowerCase().includes(q) ||
      item.contractLabel.toLowerCase().includes(q) ||
      item.contractId.toLowerCase().includes(q),
    )
  }, [contractOptions, contractQuery])

  const [selectedContractId, setSelectedContractId] = useState(contractOptions[0]?.contractId ?? '')
  const [selectedSide, setSelectedSide] = useState<OrderSide>('YES')
  const [selectedWeight, setSelectedWeight] = useState('1')
  const [legs, setLegs] = useState<DraftLeg[]>([])

  useEffect(() => {
    if (filteredContractOptions.length === 0) {
      setSelectedContractId('')
      return
    }
    if (!filteredContractOptions.some((item) => item.contractId === selectedContractId)) {
      setSelectedContractId(filteredContractOptions[0].contractId)
    }
  }, [filteredContractOptions, selectedContractId])

  const addLeg = () => {
    if (!selectedContractId) return
    const weight = Number(selectedWeight) || 1
    const duplicate = legs.some(
      (leg) => leg.contractId === selectedContractId && leg.side === selectedSide,
    )
    if (duplicate) {
      addToast({ type: 'info', message: 'This leg with same side already exists' })
      return
    }
    setLegs((prev) => [
      ...prev,
      {
        id: uid('draft-leg'),
        contractId: selectedContractId,
        side: selectedSide,
        weight: weight > 0 ? weight : 1,
      },
    ])
  }

  const importFromForecasts = () => {
    if (forecasts.length === 0) {
      addToast({ type: 'info', message: 'No forecast records found to import' })
      return
    }

    const imported: DraftLeg[] = []
    const existing = new Set(legs.map((leg) => legKey(leg.contractId, leg.side)))

    for (const forecast of forecasts) {
      if (!forecast.contractId || !optionMap[forecast.contractId]) continue
      const key = legKey(forecast.contractId, forecast.side)
      if (existing.has(key)) continue
      existing.add(key)
      imported.push({
        id: uid('draft-leg'),
        contractId: forecast.contractId,
        side: forecast.side,
        weight: 1,
      })
    }

    if (imported.length === 0) {
      addToast({ type: 'info', message: 'No compatible forecast contracts to import' })
      return
    }

    setLegs((prev) => [...prev, ...imported])
    addToast({ type: 'success', message: `Imported ${imported.length} legs from My Forecasts` })
  }

  const normalizedSum = legs.reduce((sum, leg) => sum + leg.weight, 0)
  const basketIdPreview = legs.length > 0 ? buildBasketId(legs) : ''

  return (
    <div className="px-4 md:px-6 py-6 max-w-5xl mx-auto">
      <button
        onClick={() => navigate('/strategies')}
        className="text-xs text-[#8A8A9A] hover:text-white transition-colors mb-2"
      >
        ← Back to Strategies
      </button>
      <h1 className="text-xl font-bold text-white mb-1">Create Strategy Basket</h1>
      <p className="text-xs text-[#8A8A9A] mb-4">
        Thesis is optional. You can publish a basket and let trench discussion add context later. Strategy baskets do not include DEX hedge actions.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <h2 className="text-sm font-semibold text-white mb-3">Base Info</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#8A8A9A] block mb-1">Strategy Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Blue Policy Basket"
                  className="w-full bg-[#1C1C28] border border-[#252536] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8A8A9A] outline-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#8A8A9A] block mb-1">Creator</label>
                  <input
                    value={creator}
                    onChange={(e) => setCreator(e.target.value)}
                    className="w-full bg-[#1C1C28] border border-[#252536] rounded-lg px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#8A8A9A] block mb-1">Driver Event (optional)</label>
                  <select
                    value={driverEventId}
                    onChange={(e) => setDriverEventId(e.target.value)}
                    className="w-full bg-[#1C1C28] border border-[#252536] rounded-lg px-2 py-2 text-sm text-white"
                  >
                    <option value="">No specific driver</option>
                    {events
                      .filter((event) => event.type !== 'instant')
                      .map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#8A8A9A] block mb-1">Optional Thesis</label>
                <textarea
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  rows={3}
                  placeholder="Optional. Skip if you prefer to publish without written rationale."
                  className="w-full bg-[#1C1C28] border border-[#252536] rounded-lg px-3 py-2 text-xs text-white placeholder-[#8A8A9A] outline-none resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-[#8A8A9A] block mb-1">Tags (comma separated)</label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Politics, Macro, Risk-on"
                  className="w-full bg-[#1C1C28] border border-[#252536] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8A8A9A] outline-none"
                />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-semibold text-white">Add Legs</h2>
              <Button size="sm" variant="ghost" onClick={importFromForecasts}>
                Import My Forecasts
              </Button>
            </div>

            <div className="mb-2">
              <label className="text-xs text-[#8A8A9A] block mb-1">Search contracts</label>
              <input
                value={contractQuery}
                onChange={(e) => setContractQuery(e.target.value)}
                placeholder="Search by event, contract, or id"
                className="w-full bg-[#1C1C28] border border-[#252536] rounded-lg px-3 py-2 text-xs text-white placeholder-[#8A8A9A] outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-1">
              <select
                value={selectedContractId}
                onChange={(e) => setSelectedContractId(e.target.value)}
                className="md:col-span-2 bg-[#1C1C28] border border-[#252536] rounded-lg px-2 py-2 text-xs text-white"
              >
                {filteredContractOptions.map((item) => (
                  <option key={item.contractId} value={item.contractId}>
                    {item.eventTitle} — {item.contractLabel} · ${Math.round(item.volume).toLocaleString('en-US')}
                  </option>
                ))}
              </select>
              <select
                value={selectedSide}
                onChange={(e) => setSelectedSide(e.target.value as OrderSide)}
                className="bg-[#1C1C28] border border-[#252536] rounded-lg px-2 py-2 text-xs text-white"
              >
                <option value="YES">YES</option>
                <option value="NO">NO</option>
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={selectedWeight}
                  onChange={(e) => setSelectedWeight(e.target.value)}
                  min="0.01"
                  step="0.01"
                  className="w-full bg-[#1C1C28] border border-[#252536] rounded-lg px-2 py-2 text-xs text-white outline-none"
                />
                <Button size="sm" variant="secondary" onClick={addLeg}>
                  Add
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-[#8A8A9A] mb-3">
              Showing {filteredContractOptions.length} contracts, ranked by status then volume.
            </p>

            <div className="space-y-2">
              {legs.length === 0 && (
                <p className="text-xs text-[#8A8A9A]">
                  No legs added yet. Add at least 2 to create a strategy.
                </p>
              )}
              {legs.map((leg) => {
                const opt = optionMap[leg.contractId]
                return (
                  <div
                    key={leg.id}
                    className="bg-[#0B0B0F] border border-[#252536] rounded-lg p-3 flex items-center gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{opt?.eventTitle ?? leg.contractId}</p>
                      <p className="text-[11px] text-[#8A8A9A] truncate">{opt?.contractLabel ?? leg.contractId}</p>
                    </div>
                    <select
                      value={leg.side}
                      onChange={(e) =>
                        setLegs((prev) =>
                          prev.map((item) =>
                            item.id === leg.id ? { ...item, side: e.target.value as OrderSide } : item,
                          ),
                        )
                      }
                      className="bg-[#1C1C28] border border-[#252536] rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="YES">YES</option>
                      <option value="NO">NO</option>
                    </select>
                    <input
                      type="number"
                      value={leg.weight}
                      min="0.01"
                      step="0.01"
                      onChange={(e) =>
                        setLegs((prev) =>
                          prev.map((item) =>
                            item.id === leg.id ? { ...item, weight: Number(e.target.value) || 0 } : item,
                          ),
                        )
                      }
                      className="w-20 bg-[#1C1C28] border border-[#252536] rounded px-2 py-1 text-xs text-white outline-none"
                    />
                    <button
                      onClick={() => setLegs((prev) => prev.filter((item) => item.id !== leg.id))}
                      className="text-xs text-[#E85A7E] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-white mb-2">Preview</h3>
            <p className="text-xs text-[#8A8A9A] mb-2">Basket signature preview</p>
            <p className="text-[11px] font-mono text-[#8A8A9A] break-all">{basketIdPreview || 'No legs'}</p>
            <div className="mt-3 space-y-1">
              <p className="text-xs text-[#8A8A9A]">Leg count: {legs.length}</p>
              <p className="text-xs text-[#8A8A9A]">Weight sum: {normalizedSum.toFixed(2)}</p>
            </div>
            <div className="mt-3 flex gap-1.5 flex-wrap">
              {legs.slice(0, 6).map((leg) => (
                <Badge key={leg.id} variant={leg.side === 'YES' ? 'success' : 'danger'}>
                  {leg.side}
                </Badge>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-white mb-2">Publish</h3>
            <p className="text-xs text-[#8A8A9A] mb-3">
              Written thesis is optional. You can publish now and let trench discussion add context.
            </p>
            <Button
              fullWidth
              size="sm"
              variant="primary"
              onClick={() => {
                if (!title.trim()) {
                  addToast({ type: 'error', message: 'Strategy title is required' })
                  return
                }
                if (legs.length < 2) {
                  addToast({ type: 'error', message: 'Add at least 2 legs' })
                  return
                }
                const template = createTemplate({
                  title,
                  createdBy: creator || 'You',
                  driverEventId: driverEventId || undefined,
                  legs: legs.map((leg) => ({
                    contractId: leg.contractId,
                    side: leg.side,
                    weight: leg.weight,
                  })),
                  thesis: thesis || undefined,
                  tags: tags
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                })
                addToast({
                  type: 'success',
                  message: template.thesis
                    ? 'Strategy published with thesis'
                    : 'Strategy published (thesis skipped)',
                })
                navigate(`/strategy/${template.id}`)
              }}
            >
              Publish Strategy
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
