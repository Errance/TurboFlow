import { create } from 'zustand'
import type {
  OrderSide,
  StrategyInstance,
  StrategyLeg,
  StrategyTemplate,
  TrenchMessage,
  TrenchStance,
} from '../types'
import { getContractById } from '../data/events'

export function buildBasketId(
  legs: Array<Pick<StrategyLeg, 'contractId' | 'side'>>,
): string {
  return legs
    .map((leg) => `${leg.contractId}:${leg.side}`)
    .sort()
    .join('|')
}

function normalizeLegWeights(legs: StrategyLeg[]): StrategyLeg[] {
  const valid = legs.map((leg) => ({
    ...leg,
    weight: Number.isFinite(leg.weight) && leg.weight > 0 ? leg.weight : 0,
  }))
  const sum = valid.reduce((acc, leg) => acc + leg.weight, 0)
  if (sum <= 0) {
    const equal = 1 / valid.length
    return valid.map((leg) => ({ ...leg, weight: equal }))
  }
  return valid.map((leg) => ({ ...leg, weight: leg.weight / sum }))
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function getSidePrice(contractId: string, side: OrderSide): number {
  const found = getContractById(contractId)
  if (!found) return 0.5
  return side === 'YES' ? found.contract.yesPrice : found.contract.noPrice
}

function seededTemplates(): StrategyTemplate[] {
  const base: StrategyTemplate[] = [
    {
      id: 'stg-policy-blue',
      title: 'Blue Policy Basket',
      createdBy: 'MacroHawk',
      createdAt: '2026-02-20T12:00:00Z',
      updatedAt: '2026-02-20T12:00:00Z',
      basketId: '',
      driverEventId: 'evt-us-senate-control',
      thesis:
        'If policy momentum turns pro-expansion, expect higher probability of fiscal passage and risk-on sensitivity in adjacent macro legs.',
      tags: ['Politics', 'Macro'],
      copyCount: 42,
      legs: [
        { id: 'leg-blue-1', contractId: 'ctr-senate-dem', side: 'YES', weight: 0.4 },
        { id: 'leg-blue-2', contractId: 'ctr-stablecoin-bill', side: 'YES', weight: 0.3 },
        { id: 'leg-blue-3', contractId: 'ctr-sp500-6000', side: 'YES', weight: 0.3 },
      ],
    },
    {
      id: 'stg-hawkish-macro',
      title: 'Hawkish Macro Defense',
      createdBy: 'DataDriven42',
      createdAt: '2026-02-19T09:00:00Z',
      updatedAt: '2026-02-19T09:00:00Z',
      basketId: '',
      driverEventId: 'evt-fed-rate-cut-2026',
      tags: ['Economics', 'Risk-off'],
      copyCount: 27,
      legs: [
        { id: 'leg-hawk-1', contractId: 'ctr-fed-q1', side: 'NO', weight: 0.45 },
        { id: 'leg-hawk-2', contractId: 'ctr-cpi-below2', side: 'NO', weight: 0.25 },
        { id: 'leg-hawk-3', contractId: 'ctr-sp500-6000', side: 'NO', weight: 0.3 },
      ],
    },
    {
      id: 'stg-crypto-regime',
      title: 'Crypto Regime Rotation',
      createdBy: 'CryptoOracle',
      createdAt: '2026-02-18T08:30:00Z',
      updatedAt: '2026-02-18T08:30:00Z',
      basketId: '',
      driverEventId: 'evt-stablecoin-regulation',
      thesis:
        'Regulatory clarity plus ETF path dependency can rotate liquidity toward high-beta crypto themes with policy sensitivity.',
      tags: ['Crypto', 'Policy'],
      copyCount: 65,
      legs: [
        { id: 'leg-crypto-1', contractId: 'ctr-stablecoin-bill', side: 'YES', weight: 0.35 },
        { id: 'leg-crypto-2', contractId: 'ctr-xrp-etf-approved', side: 'YES', weight: 0.25 },
        { id: 'leg-crypto-3', contractId: 'ctr-sol-flip-eth', side: 'YES', weight: 0.2 },
        { id: 'leg-crypto-4', contractId: 'ctr-btc-100k-jun', side: 'YES', weight: 0.2 },
      ],
    },
  ]

  return base.map((template) => {
    const legs = normalizeLegWeights(template.legs)
    return {
      ...template,
      legs,
      basketId: buildBasketId(legs),
    }
  })
}

function seededTrenchMessages(templates: StrategyTemplate[]): TrenchMessage[] {
  const byId: Record<string, StrategyTemplate> = {}
  templates.forEach((template) => {
    byId[template.id] = template
  })

  return [
    {
      id: 'msg-1',
      basketId: byId['stg-policy-blue'].basketId,
      author: 'MacroHawk',
      body: 'I increased fiscal-sensitive legs after polling spread tightened.',
      stance: 'support',
      votes: 18,
      createdAt: '2026-02-20T14:00:00Z',
    },
    {
      id: 'msg-2',
      basketId: byId['stg-policy-blue'].basketId,
      author: 'VixWhisperer',
      body: 'I keep the same basket direction but moved weight from risk assets to policy confirmation legs.',
      stance: 'adjust',
      votes: 11,
      createdAt: '2026-02-20T15:10:00Z',
    },
    {
      id: 'msg-3',
      basketId: byId['stg-hawkish-macro'].basketId,
      author: 'DataDriven42',
      body: 'My invalidation trigger is a surprise dovish turn at the next meeting.',
      stance: 'support',
      votes: 9,
      createdAt: '2026-02-19T10:40:00Z',
    },
  ]
}

const initialTemplates = seededTemplates()
const initialTrenchMessages = seededTrenchMessages(initialTemplates)

interface CreateStrategyParams {
  title: string
  createdBy: string
  driverEventId?: string
  legs: Array<Pick<StrategyLeg, 'contractId' | 'side' | 'weight'> & { note?: string }>
  thesis?: string
  tags?: string[]
}

interface CopyStrategyParams {
  templateId: string
  userName: string
  notional: number
}

interface StrategyStore {
  templates: StrategyTemplate[]
  instances: StrategyInstance[]
  trenchMessages: TrenchMessage[]

  getTemplate: (templateId: string) => StrategyTemplate | undefined
  getTemplatesByBasket: (basketId: string) => StrategyTemplate[]
  getMessagesByBasket: (basketId: string) => TrenchMessage[]
  getInstancesByTemplate: (templateId: string, userName?: string) => StrategyInstance[]

  createTemplate: (params: CreateStrategyParams) => StrategyTemplate
  copyTemplate: (params: CopyStrategyParams) => StrategyInstance | undefined
  updateInstanceWeights: (instanceId: string, nextWeights: Record<string, number>) => void
  addTrenchMessage: (params: {
    basketId: string
    author: string
    body: string
    stance: TrenchStance
  }) => TrenchMessage
}

export const useStrategyStore = create<StrategyStore>((set, get) => ({
  templates: initialTemplates,
  instances: [],
  trenchMessages: initialTrenchMessages,

  getTemplate: (templateId) => get().templates.find((template) => template.id === templateId),

  getTemplatesByBasket: (basketId) =>
    get()
      .templates
      .filter((template) => template.basketId === basketId)
      .sort((a, b) => b.copyCount - a.copyCount),

  getMessagesByBasket: (basketId) =>
    get()
      .trenchMessages
      .filter((message) => message.basketId === basketId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

  getInstancesByTemplate: (templateId, userName) =>
    get()
      .instances
      .filter((instance) => instance.templateId === templateId && (!userName || instance.userName === userName))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),

  createTemplate: ({ title, createdBy, driverEventId, legs, thesis, tags }) => {
    const normalizedLegs = normalizeLegWeights(
      legs.map((leg, idx) => ({
        id: uid(`leg-${idx}`),
        contractId: leg.contractId,
        side: leg.side,
        weight: leg.weight,
        note: leg.note,
      })),
    )
    const now = new Date().toISOString()
    const template: StrategyTemplate = {
      id: uid('stg'),
      title: title.trim(),
      createdBy: createdBy.trim(),
      createdAt: now,
      updatedAt: now,
      basketId: buildBasketId(normalizedLegs),
      driverEventId,
      legs: normalizedLegs,
      thesis: thesis?.trim() || undefined,
      tags: tags ?? [],
      copyCount: 0,
    }
    set((state) => ({ templates: [template, ...state.templates] }))
    return template
  },

  copyTemplate: ({ templateId, userName, notional }) => {
    const template = get().getTemplate(templateId)
    if (!template) return undefined
    const now = new Date().toISOString()
    const instance: StrategyInstance = {
      id: uid('ins'),
      templateId: template.id,
      basketId: template.basketId,
      userName: userName.trim(),
      notional: notional > 0 ? notional : 100,
      legs: template.legs.map((leg) => ({
        ...leg,
        entryPrice: getSidePrice(leg.contractId, leg.side),
      })),
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({
      instances: [instance, ...state.instances],
      templates: state.templates.map((item) =>
        item.id === templateId
          ? {
              ...item,
              copyCount: item.copyCount + 1,
              updatedAt: now,
            }
          : item,
      ),
    }))
    return instance
  },

  updateInstanceWeights: (instanceId, nextWeights) => {
    set((state) => ({
      instances: state.instances.map((instance) => {
        if (instance.id !== instanceId) return instance
        const updated = instance.legs.map((leg) => ({
          ...leg,
          weight: nextWeights[leg.id] ?? leg.weight,
        }))
        return {
          ...instance,
          legs: normalizeLegWeights(updated),
          updatedAt: new Date().toISOString(),
        }
      }),
    }))
  },

  addTrenchMessage: ({ basketId, author, body, stance }) => {
    const message: TrenchMessage = {
      id: uid('msg'),
      basketId,
      author: author.trim(),
      body: body.trim(),
      stance,
      votes: 0,
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ trenchMessages: [message, ...state.trenchMessages] }))
    return message
  },
}))
