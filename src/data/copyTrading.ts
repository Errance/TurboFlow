// Mock data for Copy Trading demo. All data is static; no API.

export type CopyButtonState = 'Copy' | 'Full' | 'Copying'

export interface TraderMock {
  id: string
  nickname: string
  avatar?: string
  isPrivate: boolean
  pnl180d: number
  roi30d: number
  aum: string
  mdd30d: string
  sharpe: string
  followerCount: number
  followerMax: number
  copyButton: CopyButtonState
  starred: boolean
}

export const mockTraders: TraderMock[] = [
  {
    id: '1',
    nickname: 'Superman',
    isPrivate: false,
    pnl180d: 123456.78,
    roi30d: 23.45,
    aum: '778,061.73',
    mdd30d: '3.36%',
    sharpe: '1.88',
    followerCount: 30,
    followerMax: 200,
    copyButton: 'Copy',
    starred: true,
  },
  {
    id: '2',
    nickname: 'Alex',
    isPrivate: false,
    pnl180d: -3456.78,
    roi30d: -23.45,
    aum: '778,061.73',
    mdd30d: '3.36%',
    sharpe: '1.88',
    followerCount: 30,
    followerMax: 200,
    copyButton: 'Full',
    starred: false,
  },
  {
    id: '3',
    nickname: 'BOB',
    isPrivate: false,
    pnl180d: 123456.78,
    roi30d: 23.45,
    aum: '778,061.73',
    mdd30d: '3.36%',
    sharpe: '1.88',
    followerCount: 30,
    followerMax: 200,
    copyButton: 'Copying',
    starred: false,
  },
  {
    id: '4',
    nickname: 'James',
    isPrivate: true,
    pnl180d: 23456.78,
    roi30d: 10,
    aum: '123,456.78',
    mdd30d: '2.1%',
    sharpe: '2.0',
    followerCount: 15,
    followerMax: 50,
    copyButton: 'Copy',
    starred: true,
  },
  {
    id: '5',
    nickname: 'CryptoKing',
    isPrivate: false,
    pnl180d: -12000,
    roi30d: -15.2,
    aum: '500,000.00',
    mdd30d: '5.00%',
    sharpe: '1.2',
    followerCount: 80,
    followerMax: 200,
    copyButton: 'Copy',
    starred: false,
  },
  {
    id: '6',
    nickname: 'AlphaTrader',
    isPrivate: false,
    pnl180d: 89000,
    roi30d: 18.9,
    aum: '1,200,000.00',
    mdd30d: '2.80%',
    sharpe: '2.1',
    followerCount: 200,
    followerMax: 200,
    copyButton: 'Full',
    starred: true,
  },
]

export interface TraderDetailMock extends TraderMock {
  copiedOn: string
  netCopyAmount: string
  marginBalance: string
  unrealizedPnl: string
  realizedPnl: string
  profitShared: string
  netProfit: string
}

export function getTraderById(id: string): TraderDetailMock | undefined {
  const t = mockTraders.find((x) => x.id === id)
  if (!t) return undefined
  return {
    ...t,
    copiedOn: '2026-01-22 23:12',
    netCopyAmount: '778,061.73',
    marginBalance: '23,456.78',
    unrealizedPnl: '-1,000.00',
    realizedPnl: '456.78',
    profitShared: '+3,000.00',
    netProfit: '+2,345.78',
  }
}

export const mockPositions = [
  {
    pair: 'BTC/USDT',
    leverage: '10x',
    positionType: 'Isolated',
    status: 'Open',
    avgEntryPrice: '110,000.00',
    avgIndexPrice: '100,000.00',
    maxOpenInterest: '100,000.00',
    openTime: '2025-02-04 12:01:01',
    closeTime: '-',
    closedSize: '-',
    realizedPnl: '+12.34',
    realizedRoi: '+12.34%',
  },
  {
    pair: 'ETH/USDT',
    leverage: '20x',
    positionType: 'Cross',
    status: 'Closed',
    avgEntryPrice: '3,200.00',
    avgIndexPrice: '3,100.00',
    maxOpenInterest: '50,000.00',
    openTime: '2025-02-03 08:00:00',
    closeTime: '2025-02-04 12:01:01',
    closedSize: '50,000.00',
    realizedPnl: '+8.50',
    realizedRoi: '+8.50%',
  },
]
