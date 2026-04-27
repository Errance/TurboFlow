import { useState } from 'react'
import { useParlayStore } from '../stores/parlayStore'
import type { ParlayMode } from '../stores/parlayStore'
import Button from './ui/Button'

function formatUsdc(v: number): string {
  return v.toFixed(2)
}

// ── ParlayBar (persistent compact bar) ──────────────────────────

function ParlayBar({ legCount, odds, onOpen }: { legCount: number; odds: number; onOpen: () => void }) {
  return (
    <>
      {/* Mobile: above tab bar */}
      <div
        onClick={onOpen}
        className="md:hidden fixed bottom-[56px] left-0 right-0 z-31 bg-[var(--bg-card)] border-t border-[#2DD4BF]/20 px-4 flex items-center justify-between cursor-pointer min-h-[40px] hover:bg-[var(--bg-control)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[#2DD4BF]">
            <path d="M2 3h2l2 8h6l2-6H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="7" cy="14" r="1" fill="currentColor" />
            <circle cx="12" cy="14" r="1" fill="currentColor" />
          </svg>
          <span className="text-xs font-medium text-[var(--text-primary)]">串关</span>
          <span className="text-[10px] bg-[#2DD4BF]/10 text-[#2DD4BF] px-1.5 py-0.5 rounded font-bold">
            {legCount}
          </span>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">{odds.toFixed(2)}x</span>
        </div>
        <span className="text-xs text-[#2DD4BF] font-medium">查看投注单</span>
      </div>

      {/* Desktop: sticky bottom-right card */}
      <div
        onClick={onOpen}
        className="hidden md:flex fixed bottom-4 right-4 z-40 bg-[var(--bg-card)] border border-[#2DD4BF]/20 rounded-xl px-4 py-3 items-center gap-3 cursor-pointer shadow-lg shadow-[#2DD4BF]/10 hover:border-[#2DD4BF]/40 transition-colors min-w-[240px]"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#2DD4BF] shrink-0">
          <path d="M2 3h2l2 8h6l2-6H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="7" cy="14" r="1" fill="currentColor" />
          <circle cx="12" cy="14" r="1" fill="currentColor" />
        </svg>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">串关注单</span>
            <span className="text-[10px] bg-[#2DD4BF]/10 text-[#2DD4BF] px-1.5 py-0.5 rounded font-bold">
              {legCount} 项
            </span>
          </div>
          <span className="text-xs text-[var(--text-secondary)] font-mono">总赔率：{odds.toFixed(2)}x</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--text-secondary)] shrink-0">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </>
  )
}

// ── ParlayPanel (expanded full panel) ───────────────────────────

function ParlayPanel({
  slip,
  combinedOdds,
  onClose,
  onRemoveLeg,
  onClear,
  onPlace,
}: {
  slip: ReturnType<typeof useParlayStore.getState>['slip']
  combinedOdds: number
  onClose: () => void
  onRemoveLeg: (contractId: string) => void
  onClear: () => void
  onPlace: (stake: number, mode: ParlayMode) => void
}) {
  const [stake, setStake] = useState('')
  const [mode, setMode] = useState<ParlayMode>('parlay')
  const parsedStake = parseFloat(stake) || 0
  const potentialPayout = parsedStake * combinedOdds
  const potentialProfit = potentialPayout - parsedStake
  const canPlace = slip.length >= 2 && parsedStake > 0

  const stakePerLeg = parsedStake > 0 ? parsedStake / slip.length : 0
  const legCosts = slip.map((leg) => {
    const shares = Math.round(stakePerLeg / leg.price)
    const legCost = Math.round(shares * leg.price * 100) / 100
    return { leg, shares, legCost }
  })
  const actualCost = legCosts.reduce((s, l) => s + l.legCost, 0)
  const residual = parsedStake > 0 ? Math.round((parsedStake - actualCost) * 100) / 100 : 0

  const handlePlace = () => {
    if (!canPlace) return
    onPlace(parsedStake, mode)
    setStake('')
  }

  return (
    <>
      {/* Backdrop on mobile */}
      <div className="md:hidden fixed inset-0 bg-[var(--overlay-bg)] z-40" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 md:bottom-4 md:right-4 md:left-auto md:w-[380px] z-50 bg-[var(--bg-card)] border-t md:border border-[var(--border)] md:rounded-xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Handle + Header */}
        <div className="md:hidden w-10 h-1 bg-[var(--border)] rounded-full mx-auto mt-2" />
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">串关注单</h3>
            <span className="text-[10px] bg-[#2DD4BF]/10 text-[#2DD4BF] px-1.5 py-0.5 rounded font-medium">
              {slip.length} 项
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClear} className="text-xs text-[var(--text-secondary)] hover:text-[#E85A7E] transition-colors">
              清空全部
            </button>
            <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="px-4 pt-3 flex gap-1 bg-[var(--bg-control)] mx-4 mt-3 rounded-lg p-1">
          {(['parlay', 'bundle'] as ParlayMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mode === m
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {m === 'parlay' ? '串关' : '单项组合'}
            </button>
          ))}
        </div>
        <p className="px-4 mt-1.5 text-[10px] text-[var(--text-secondary)]">
          {mode === 'parlay'
            ? '所有选项都命中才可获胜，返还更高但风险更高。'
            : '每个选项独立结算，允许部分命中。'}
        </p>

        {/* Legs */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {slip.map((leg) => (
            <div
              key={leg.contractId}
              className="bg-[var(--bg-base)] rounded-lg p-3 flex items-start justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--text-secondary)] truncate">{leg.eventTitle}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    leg.side === 'YES' ? 'bg-[#2DD4BF]/20 text-[#2DD4BF]' : 'bg-[#E85A7E]/20 text-[#E85A7E]'
                  }`}>
                    {leg.side === 'YES' ? '是' : '否'}
                  </span>
                  <span className="text-xs text-[var(--text-primary)] truncate">{leg.contractLabel}</span>
                  <span className="text-xs text-[var(--text-secondary)] font-mono">{formatUsdc(leg.price)}</span>
                </div>
              </div>
              <button
                onClick={() => onRemoveLeg(leg.contractId)}
                className="text-[var(--text-secondary)] hover:text-[#E85A7E] transition-colors p-0.5 shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}

          {slip.length < 2 && (
            <p className="text-xs text-[#F59E0B] bg-[#F59E0B]/10 rounded-lg p-3">
              至少添加 2 个投注项后才可提交串关。
            </p>
          )}
        </div>

        {/* Stake + Summary (pinned bottom) */}
        <div className="p-4 border-t border-[var(--border)] space-y-3">
          <div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">总赔率</span>
              <span className="text-[var(--text-primary)] font-mono font-medium">{combinedOdds.toFixed(2)}x</span>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)]/70 font-mono mt-1 overflow-x-auto scrollbar-hide whitespace-nowrap">
              1 ÷ ({slip.map((l) => l.price.toFixed(2)).join(' × ')}) = {combinedOdds.toFixed(2)}x
            </p>
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">投注金额（USDC）</label>
            <div className="flex items-center gap-2 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-2">
              <span className="text-sm text-[var(--text-secondary)]">$</span>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
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
                  onClick={() => setStake(String(v))}
                  className="flex-1 py-2 text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-base)] rounded hover:bg-[var(--border)] hover:text-[var(--text-primary)] transition-colors"
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>

          {parsedStake > 0 && (
            <div className="bg-[var(--bg-base)] rounded-lg p-3 space-y-1.5">
              {slip.length >= 2 && (
                <div className="space-y-1 mb-1.5 pb-1.5 border-b border-[var(--border)]">
                  {legCosts.map(({ leg, shares, legCost }) => (
                    <div key={leg.contractId} className="flex justify-between text-[10px]">
                      <span className="text-[var(--text-secondary)] truncate max-w-[55%]">{leg.contractLabel}</span>
                      <span className="text-[var(--text-secondary)] font-mono">{formatUsdc(legCost)} USDC → {shares} 份</span>
                    </div>
                  ))}
                  {residual !== 0 && (
                    <div className="flex justify-between text-[10px] pt-0.5">
                      <span className="text-[var(--text-secondary)]">{residual > 0 ? '退回余额' : '额外扣除'}</span>
                      <span className="text-[var(--text-secondary)] font-mono">
                        {residual > 0 ? '+' : ''}{formatUsdc(residual)} USDC
                      </span>
                    </div>
                  )}
                </div>
              )}
              {mode === 'parlay' ? (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">可能返还</span>
                    <span className="text-[#2DD4BF] font-mono">{formatUsdc(potentialPayout)} USDC</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-[var(--border)] pt-1.5">
                    <span className="text-[var(--text-secondary)]">可能净盈利</span>
                    <span className="text-[#2DD4BF] font-mono font-medium">
                      +{formatUsdc(potentialProfit)} USDC
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">最高返还（全部命中）</span>
                    <span className="text-[#2DD4BF] font-mono">
                      {formatUsdc(legCosts.reduce((s, l) => s + l.shares, 0))} USDC
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-[var(--text-secondary)]">
                    <span>每个选项命中后按 1 USDC / 份结算</span>
                  </div>
                </>
              )}
            </div>
          )}

          <Button
            variant="primary"
            fullWidth
            size="lg"
            disabled={!canPlace}
            onClick={handlePlace}
          >
            {slip.length < 2
              ? `还需添加 ${2 - slip.length} 个投注项`
              : parsedStake > 0
                ? `提交${mode === 'parlay' ? '串关' : '单项组合'} — ${formatUsdc(parsedStake)} USDC`
                : '请输入投注金额'}
          </Button>
        </div>
      </div>
    </>
  )
}

// ── Root ParlaySlip component ───────────────────────────────────

export default function ParlaySlip() {
  const slip = useParlayStore((s) => s.slip)
  const slipOpen = useParlayStore((s) => s.slipOpen)
  const removeLeg = useParlayStore((s) => s.removeLeg)
  const clearSlip = useParlayStore((s) => s.clearSlip)
  const openSlip = useParlayStore((s) => s.openSlip)
  const closeSlip = useParlayStore((s) => s.closeSlip)
  const placeParlay = useParlayStore((s) => s.placeParlay)

  if (slip.length === 0) return null

  const combinedOdds = slip.reduce((acc, leg) => acc / leg.price, 1)

  if (!slipOpen) {
    return <ParlayBar legCount={slip.length} odds={combinedOdds} onOpen={openSlip} />
  }

  return (
    <ParlayPanel
      slip={slip}
      combinedOdds={combinedOdds}
      onClose={closeSlip}
      onRemoveLeg={removeLeg}
      onClear={clearSlip}
      onPlace={(stake, mode) => placeParlay(stake, mode)}
    />
  )
}
