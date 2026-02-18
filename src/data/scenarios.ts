import type { QuickOrderScenario } from '../types'

export const quickOrderScenarios: QuickOrderScenario[] = [
  {
    id: 'scenario-filled',
    marketId: 'mkt-btc-100k',
    outcome: 'filled',
    estimatedAvgPrice: 65.2,
    estimatedLevels: 1,
    estimatedFee: 0.5,
    steps: [
      { delay: 800, status: 'Pending' },
      { delay: 1500, status: 'Filled', filledQuantity: 100 },
    ],
  },
  {
    id: 'scenario-partial',
    marketId: 'mkt-btc-100k',
    outcome: 'partial_then_filled',
    estimatedAvgPrice: 65.5,
    estimatedLevels: 3,
    estimatedFee: 0.75,
    steps: [
      { delay: 800, status: 'Pending' },
      { delay: 1200, status: 'PartialFill', filledQuantity: 60 },
      { delay: 1800, status: 'Filled', filledQuantity: 100 },
    ],
  },
  {
    id: 'scenario-rejected',
    marketId: 'mkt-eth-merge',
    outcome: 'rejected',
    estimatedAvgPrice: 78,
    estimatedLevels: 0,
    estimatedFee: 0,
    steps: [
      { delay: 800, status: 'Pending' },
      {
        delay: 500,
        status: 'Rejected',
        rejectReason: '市场已截止，等待结算',
        rejectCta: { label: '去查看持仓', route: '/portfolio' },
      },
    ],
  },
]
