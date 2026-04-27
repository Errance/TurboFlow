import { useState } from 'react'
import { useClobStore } from '../../stores/clobStore'

type TabId = 'positions' | 'orders' | 'history' | 'settled'

export default function PositionsPanel() {
  const { positions, orders, trades, closePosition, cancelOrder } = useClobStore()
  const [activeTab, setActiveTab] = useState<TabId>('positions')

  const openPositions = [...positions.values()].filter(p => p.status === 'open')
  const settledPositions = [...positions.values()].filter(p => p.status === 'settled' || p.status === 'closed')
  const openOrders = [...orders.values()].filter(o => o.status === 'open' || o.status === 'partial')
  const recentTrades = [...trades].reverse().slice(0, 20)

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'positions', label: '持仓', count: openPositions.length },
    { id: 'orders', label: '挂单', count: openOrders.length },
    { id: 'history', label: '成交', count: recentTrades.length },
    { id: 'settled', label: '已结算', count: settledPositions.length },
  ]

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <div className="flex border-b border-[var(--border)]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-[10px] font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-[#2DD4BF] border-b-2 border-[#2DD4BF]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1 text-[9px] opacity-60">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="p-3 max-h-[300px] overflow-y-auto">
        {activeTab === 'positions' && (
          openPositions.length === 0 ? (
            <p className="text-[10px] text-[var(--text-secondary)] text-center py-4">暂无持仓</p>
          ) : (
            <div className="space-y-2">
              {openPositions.map(pos => (
                <div key={pos.id} className="bg-[var(--bg-control)] rounded-lg p-2.5 space-y-1.5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-[var(--text-secondary)] truncate">{pos.marketQuestion}</p>
                      {pos.outcomeLabel && (
                        <p className="text-xs text-[var(--text-primary)]">{pos.outcomeLabel}</p>
                      )}
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                      pos.side === 'yes' ? 'bg-[#2DD4BF]/10 text-[#2DD4BF]' : 'bg-[#E85A7E]/10 text-[#E85A7E]'
                    }`}>
                      {pos.side === 'yes' ? '是' : '否'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-[var(--text-secondary)]">
                      {pos.shares} 份 @ {pos.avgPrice}¢
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      成本 ${pos.totalCost.toFixed(2)}
                    </span>
                    <span className={`font-mono font-medium ml-auto ${
                      pos.unrealizedPnl >= 0 ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'
                    }`}>
                      {pos.unrealizedPnl >= 0 ? '+' : ''}{pos.unrealizedPnl.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => closePosition(pos.id)}
                    className="w-full py-1 text-[10px] text-[var(--text-secondary)] hover:text-[#E85A7E] bg-[var(--border)]/50 rounded transition-colors"
                  >
                    平仓
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'orders' && (
          openOrders.length === 0 ? (
            <p className="text-[10px] text-[var(--text-secondary)] text-center py-4">暂无挂单</p>
          ) : (
            <div className="space-y-2">
              {openOrders.map(ord => (
                <div key={ord.id} className="bg-[var(--bg-control)] rounded-lg p-2.5 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-[var(--text-secondary)] truncate">{ord.marketQuestion}</p>
                    <p className="text-xs font-mono">
                      <span className={ord.side === 'yes' ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'}>
                        {ord.side === 'yes' ? '是' : '否'}
                      </span>
                      {' '}
                      <span className="text-[var(--text-primary)]">{ord.shares - ord.filledShares}份</span>
                      {' @ '}
                      <span className="text-[var(--text-primary)]">{ord.price}¢</span>
                    </p>
                  </div>
                  <button
                    onClick={() => cancelOrder(ord.id)}
                    className="text-[10px] text-[var(--text-secondary)] hover:text-[#E85A7E] transition-colors"
                  >
                    取消
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'history' && (
          recentTrades.length === 0 ? (
            <p className="text-[10px] text-[var(--text-secondary)] text-center py-4">暂无成交</p>
          ) : (
            <div className="space-y-1">
              {recentTrades.map(t => (
                <div key={t.id} className="flex items-center gap-2 py-1 text-[10px]">
                  <span className={`w-6 text-center font-medium ${
                    t.side === 'yes' ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'
                  }`}>
                    {t.side === 'yes' ? '是' : '否'}
                  </span>
                  <span className="flex-1 text-[var(--text-secondary)] truncate">{t.marketQuestion}</span>
                  <span className="font-mono text-[var(--text-primary)]">{t.shares}@{t.price}¢</span>
                  <span className="font-mono text-[var(--text-secondary)]">${t.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'settled' && (
          settledPositions.length === 0 ? (
            <p className="text-[10px] text-[var(--text-secondary)] text-center py-4">暂无已结算持仓</p>
          ) : (
            <div className="space-y-2">
              {settledPositions.map(pos => (
                <div key={pos.id} className="bg-[var(--bg-control)] rounded-lg p-2.5">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-[10px] text-[var(--text-secondary)] truncate flex-1">{pos.marketQuestion}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                      pos.settlementResult === 'void'
                        ? 'bg-amber-500/10 text-amber-400'
                        : (pos.finalPnl ?? 0) >= 0
                          ? 'bg-[#2DD4BF]/10 text-[#2DD4BF]'
                          : 'bg-[#E85A7E]/10 text-[#E85A7E]'
                    }`}>
                      {pos.settlementResult === 'void' ? '作废' : (pos.finalPnl ?? 0) >= 0 ? '赢' : '输'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-[var(--text-secondary)]">{pos.shares} 份 {pos.side === 'yes' ? '是' : '否'}</span>
                    <span className={`font-mono font-medium ml-auto ${
                      (pos.finalPnl ?? 0) >= 0 ? 'text-[#2DD4BF]' : 'text-[#E85A7E]'
                    }`}>
                      {(pos.finalPnl ?? 0) >= 0 ? '+' : ''}{(pos.finalPnl ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
