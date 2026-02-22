import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { getContractById } from '../data/events'
import { useStrategyStore } from '../stores/strategyStore'
import { useEventStore } from '../stores/eventStore'
import { useToastStore } from '../stores/toastStore'

function shortBasketId(basketId: string): string {
  if (basketId.length <= 32) return basketId
  return `${basketId.slice(0, 16)}...${basketId.slice(-10)}`
}

export default function StrategiesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const templates = useStrategyStore((s) => s.templates)
  const copyTemplate = useStrategyStore((s) => s.copyTemplate)
  const events = useEventStore((s) => s.events)
  const addToast = useToastStore((s) => s.addToast)

  const eventFilterId = searchParams.get('eventId')
  const eventFilter = useMemo(
    () => (eventFilterId ? events.find((event) => event.id === eventFilterId) : undefined),
    [eventFilterId, events],
  )

  const filteredTemplates = useMemo(() => {
    if (!eventFilter) return templates
    const contractSet = new Set(eventFilter.contracts.map((contract) => contract.id))
    return templates.filter((template) =>
      template.legs.some((leg) => contractSet.has(leg.contractId)),
    )
  }, [eventFilter, templates])

  const basketCount = useMemo(() => {
    return new Set(filteredTemplates.map((item) => item.basketId)).size
  }, [filteredTemplates])

  const ranked = useMemo(
    () => [...filteredTemplates].sort((a, b) => b.copyCount - a.copyCount),
    [filteredTemplates],
  )

  return (
    <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Strategies</h1>
          <p className="text-xs text-[#8A8A9A] mt-1">
            Basket identity is side-signature based. Weight changes create new allocations, not new baskets. Strategy baskets do not include DEX hedge actions.
          </p>
        </div>
        <Button size="sm" variant="primary" onClick={() => navigate('/strategy/new')}>
          Create Strategy
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <Card>
          <p className="text-xs text-[#8A8A9A] mb-1">Templates</p>
          <p className="text-lg font-semibold text-white">{filteredTemplates.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-[#8A8A9A] mb-1">Unique Baskets</p>
          <p className="text-lg font-semibold text-white">{basketCount}</p>
        </Card>
        <Card>
          <p className="text-xs text-[#8A8A9A] mb-1">Total Copies</p>
          <p className="text-lg font-semibold text-white">
            {filteredTemplates.reduce((sum, item) => sum + item.copyCount, 0)}
          </p>
        </Card>
      </div>

      {eventFilter && (
        <Card className="mb-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[#8A8A9A]">
              Filtered by event: <span className="text-white">{eventFilter.title}</span>
            </p>
            <Button size="sm" variant="ghost" onClick={() => navigate('/strategies')}>
              Clear Filter
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {ranked.map((strategy) => {
          const hasThesis = Boolean(strategy.thesis?.trim())
          const previewLegs = strategy.legs.slice(0, 4)
          return (
            <Card key={strategy.id}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <button
                    className="text-left text-sm md:text-base font-semibold text-white hover:text-[#2DD4BF] transition-colors"
                    onClick={() => navigate(`/strategy/${strategy.id}`)}
                  >
                    {strategy.title}
                  </button>
                  <p className="text-xs text-[#8A8A9A] mt-1">
                    by {strategy.createdBy} · {strategy.legs.length} legs · {strategy.copyCount} copies
                  </p>
                </div>
                <div className="shrink-0">
                  <Badge variant={hasThesis ? 'success' : 'neutral'}>
                    {hasThesis ? 'Thesis Added' : 'No Thesis'}
                  </Badge>
                </div>
              </div>

              <p className="text-[11px] text-[#8A8A9A] font-mono mb-3">
                Basket ID: {shortBasketId(strategy.basketId)}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {previewLegs.map((leg) => {
                  const found = getContractById(leg.contractId)
                  return (
                    <span
                      key={leg.id}
                      className={`text-[10px] px-2 py-1 rounded-full ${
                        leg.side === 'YES'
                          ? 'bg-[#2DD4BF]/10 text-[#2DD4BF]'
                          : 'bg-[#E85A7E]/10 text-[#E85A7E]'
                      }`}
                    >
                      {leg.side} · {found?.contract.label ?? leg.contractId}
                    </span>
                  )
                })}
                {strategy.legs.length > previewLegs.length && (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-[#252536] text-[#8A8A9A]">
                    +{strategy.legs.length - previewLegs.length} more
                  </span>
                )}
              </div>

              <p className="text-xs text-[#8A8A9A] mb-3 line-clamp-2">
                {hasThesis
                  ? strategy.thesis
                  : 'Optional thesis was skipped. This strategy is tradable and copyable without a written rationale.'}
              </p>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/strategy/${strategy.id}`)}
                >
                  Open
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    const instance = copyTemplate({
                      templateId: strategy.id,
                      userName: 'You',
                      notional: 100,
                    })
                    if (!instance) {
                      addToast({ type: 'error', message: 'Unable to copy strategy' })
                      return
                    }
                    addToast({
                      type: 'success',
                      message: `Copied strategy with ${instance.legs.length} legs`,
                    })
                  }}
                >
                  Copy 100 USDC
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
