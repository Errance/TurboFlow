import { useEffect, useMemo, useState } from 'react'
import type { SoccerMatch } from '../../data/soccer/types'
import Button from '../ui/Button'
import Input from '../ui/Input'
import ConfirmBetDialog from './ConfirmBetDialog'
import BetSlipSettingsMenu from './BetSlipSettingsMenu'
import { useSoccerBetSlipStore, type ExtendedBetSlipItem } from '../../stores/soccerBetSlipStore'
import { useWalletStore } from '../../stores/walletStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useToastStore } from '../../stores/toastStore'
import { useOddsLockCountdown } from '../../services/oddsLock'
import { BETTING_LIMITS } from '../../data/soccer/contracts'
import type { SystemType } from '../../data/soccer/contracts'
import type { BetType } from '../../data/soccer/types'
import { getMatchById } from '../../data/soccer/mockData'
import { formatOdds } from '../../utils/oddsFormat'
import { buildSystemBetProjection, getSystemMeta } from '../../utils/systemBets'

/**
 * 投注单面板。Phase 3 完整重构：
 * - 顶部余额条
 * - 投注类型 tabs（单/串/复，复式详细 UI 留到 Phase 8）
 * - 每腿展示赔率变动 badge + 30s 锁定倒计时
 * - 快选金额 chips（含 MAX）
 * - 可能返还 / 可能净盈利拆两行展示
 * - 折叠展开（chevron）
 * - 串单 ≥ 3 腿或 stake ≥ 1000 触发二次确认弹窗
 */

interface Props {
  currentMatchId: string
  suspendedMarkets?: Set<string>
  matchStatus?: SoccerMatch['status']
}

const ENDED_STATUSES = new Set([
  'finished',
  'interrupted',
  'abandoned',
  'postponed',
  'cancelled',
  'corrected',
])
const CLOSED_MARKET_STATUSES = new Set(['suspended', 'settled', 'void', 'cancelled', 'hidden'])

const STATUS_MESSAGES: Record<string, string> = {
  finished: '比赛已结束，所有盘口已结算',
  abandoned: '比赛异常结束，盘口按规则结算',
  cancelled: '比赛已取消，所有盘口作废退款',
  corrected: '比赛结果已修正',
}

type Group = { matchId: string; matchLabel: string; items: ExtendedBetSlipItem[] }

function groupByMatch(items: ExtendedBetSlipItem[], currentMatchId: string): Group[] {
  const map = new Map<string, Group>()
  for (const it of items) {
    const g = map.get(it.matchId)
    if (g) g.items.push(it)
    else map.set(it.matchId, { matchId: it.matchId, matchLabel: it.matchLabel, items: [it] })
  }
  const groups = Array.from(map.values())
  groups.sort((a, b) => {
    if (a.matchId === currentMatchId) return -1
    if (b.matchId === currentMatchId) return 1
    return (a.items[0]?.addedAt ?? 0) - (b.items[0]?.addedAt ?? 0)
  })
  return groups
}

function fmtMoney(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function collectClosedMarketTitles(matchId: string): Set<string> {
  const closed = new Set<string>()
  const match = getMatchById(matchId)
  if (!match) return closed
  for (const tab of match.tabs) {
    for (const market of tab.markets) {
      if (market.status && CLOSED_MARKET_STATUSES.has(market.status)) closed.add(market.title)
    }
  }
  return closed
}

const CONFIRM_STAKE_THRESHOLD = 1000
const CONFIRM_LEGS_THRESHOLD = 3

export default function SoccerBetSlip({ currentMatchId, suspendedMarkets, matchStatus }: Props) {
  const [amount, setAmount] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const items = useSoccerBetSlipStore((s) => s.items)
  const betType = useSoccerBetSlipStore((s) => s.betType)
  const systemType = useSoccerBetSlipStore((s) => s.systemType)
  const submitting = useSoccerBetSlipStore((s) => s.submitting)
  const setBetType = useSoccerBetSlipStore((s) => s.setBetType)
  const setSystemType = useSoccerBetSlipStore((s) => s.setSystemType)
  const removeById = useSoccerBetSlipStore((s) => s.removeById)
  const clearMatch = useSoccerBetSlipStore((s) => s.clearMatch)
  const clearAll = useSoccerBetSlipStore((s) => s.clearAll)
  const placeBet = useSoccerBetSlipStore((s) => s.placeBet)
  const acceptOddsChange = useSoccerBetSlipStore((s) => s.acceptOddsChange)
  const acceptAllOddsChanges = useSoccerBetSlipStore((s) => s.acceptAllOddsChanges)

  const balance = useWalletStore((s) => s.balance)
  const locked = useWalletStore((s) => s.locked)
  const acceptPolicy = useSettingsStore((s) => s.acceptPolicy)
  const oddsFormat = useSettingsStore((s) => s.oddsFormat)
  const addToast = useToastStore((s) => s.addToast)

  const lockCountdown = useOddsLockCountdown()

  useEffect(() => {
    if (items.length <= 1 && betType !== 'single') setBetType('single')
    if (items.length === 2 && betType === 'system') setBetType('accumulator')
  }, [items.length, betType, setBetType])

  const totalOdds = useMemo(
    () => items.reduce((acc, item) => acc * item.oddsCurrent, 1),
    [items],
  )
  const systemProjection = useMemo(
    () => (betType === 'system' ? buildSystemBetProjection(systemType, items) : null),
    [betType, systemType, items],
  )

  const stake = parseFloat(amount) || 0
  const displayOdds = systemProjection?.totalOdds ?? totalOdds
  const totalStake = systemProjection ? +(stake * systemProjection.lineCount).toFixed(2) : stake
  const potentialReturn = stake > 0 ? +(stake * displayOdds).toFixed(2) : 0
  const potentialProfit = +(potentialReturn - totalStake).toFixed(2)

  const groups = useMemo(() => groupByMatch(items, currentMatchId), [items, currentMatchId])
  const crossMatchCount = groups.filter((g) => g.matchId !== currentMatchId).length

  const isMatchEnded = matchStatus ? ENDED_STATUSES.has(matchStatus) : false
  const hasCurrentMatchItems = items.some((it) => it.matchId === currentMatchId)
  const unavailableItemIds = useMemo(() => {
    const ids = new Set<string>()
    for (const it of items) {
      const match = getMatchById(it.matchId)
      if (!match || ENDED_STATUSES.has(match.status)) {
        ids.add(it.id)
        continue
      }
      if (collectClosedMarketTitles(it.matchId).has(it.marketTitle)) ids.add(it.id)
    }
    return ids
  }, [items])
  const hasUnavailableInSlip = unavailableItemIds.size > 0
  const hasStaleQuote = items.some(
    (it) => it.quoteState === 'needs_refresh' || (lockCountdown[it.id] ?? 0) === 0,
  )

  // 腿数的合法区间 / 标签
  const requiredSystemLegs = betType === 'system' ? getSystemMeta(systemType).requiredLegs : null
  const minLegs = requiredSystemLegs ?? BETTING_LIMITS.minLegs[betType]
  const maxLegs = requiredSystemLegs ?? BETTING_LIMITS.maxLegs
  const legsInRange = items.length >= minLegs && items.length <= maxLegs

  const handlePrimaryClick = () => {
    if (stake < BETTING_LIMITS.minStake) {
      addToast({ type: 'error', message: `单注不得低于 ${BETTING_LIMITS.minStake} USDT` })
      return
    }
    const shouldConfirm =
      items.length >= CONFIRM_LEGS_THRESHOLD || stake >= CONFIRM_STAKE_THRESHOLD
    if (shouldConfirm) {
      setConfirmOpen(true)
      return
    }
    void doPlaceBet()
  }

  const doPlaceBet = async () => {
    const suspendedSelectionKeys = new Set<string>()
    const endedMatchIds = new Set<string>()
    const matchIds = new Set(items.map((it) => it.matchId))

    for (const id of matchIds) {
      const match = getMatchById(id)
      if (!match || ENDED_STATUSES.has(match.status)) {
        endedMatchIds.add(id)
        continue
      }
      for (const title of collectClosedMarketTitles(id)) {
        suspendedSelectionKeys.add(`${id}|${title}`)
      }
    }

    const result = await placeBet(stake, { suspendedSelectionKeys, endedMatchIds })
    if (result.ok) {
      setAmount('')
      setConfirmOpen(false)
    } else {
      // reject 已经在 store 内发出 toast，这里仅关弹窗，保留金额让用户调整
      setConfirmOpen(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">投注单</h3>
          <div className="flex items-center gap-1.5">
            <BalanceBadge balance={balance} locked={locked} />
            <BetSlipSettingsMenu />
          </div>
        </div>
        {isMatchEnded && matchStatus ? (
          <p className="text-xs text-[var(--text-secondary)] text-center py-6">
            {STATUS_MESSAGES[matchStatus] ?? '比赛已结束'}
          </p>
        ) : (
          <p className="text-xs text-[var(--text-secondary)] text-center py-6">
            点击赔率按钮添加选项
          </p>
        )}
      </div>
    )
  }

  const betTypes: { id: BetType; label: string }[] = [
    { id: 'single', label: '单式' },
    { id: 'accumulator', label: '串关' },
    { id: 'system', label: '复式' },
  ]
  const systemTypes: { id: SystemType; label: string }[] = [
    { id: 'trixie', label: 'Trixie' },
    { id: 'patent', label: 'Patent' },
    { id: 'yankee', label: 'Yankee' },
  ]

  return (
    <>
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label={collapsed ? '展开投注单' : '收起投注单'}
            >
              <svg
                className={`w-4 h-4 transition-transform ${collapsed ? '-rotate-90' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
              投注单
              <span className="ml-1.5 text-[10px] bg-[#2DD4BF] text-[#0B0B0F] px-1.5 py-0.5 rounded-full font-bold">
                {items.length}
              </span>
              {crossMatchCount > 0 && (
                <span className="ml-1.5 text-[10px] text-[var(--text-secondary)] font-normal">
                  · 跨 {groups.length} 场
                </span>
              )}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <BalanceBadge balance={balance} locked={locked} />
            <BetSlipSettingsMenu />
          </div>
        </div>

        {/* Clear actions */}
        <div className="flex items-center justify-end gap-3 mb-3 text-xs">
          {hasCurrentMatchItems && crossMatchCount > 0 && (
            <button
              onClick={() => clearMatch(currentMatchId)}
              className="text-[var(--text-secondary)] hover:text-[#E85A7E] transition-colors"
            >
              清空当前场
            </button>
          )}
          <button
            onClick={clearAll}
            className="text-[var(--text-secondary)] hover:text-[#E85A7E] transition-colors"
          >
            清空全部
          </button>
        </div>

        {collapsed && (
          <div className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-xs flex items-center justify-between">
            <span className="text-[var(--text-secondary)]">
              已收起 · {items.length} 项 · {groups.length} 场
            </span>
            <span className="font-mono font-semibold text-[var(--text-primary)]">
              {formatOdds(displayOdds, oddsFormat)}
            </span>
          </div>
        )}

        {!collapsed && (
          <>
            {/* BetType tabs */}
            <div className="mb-3">
              {items.length === 1 && (
                <div className="rounded-lg bg-[var(--bg-control)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                  单关 · 只结算当前 1 个选项
                </div>
              )}
              {items.length > 1 && (
                <div className="flex gap-1 p-0.5 bg-[var(--bg-control)] rounded-lg">
              {betTypes.filter((t) => t.id !== 'single').map((t) => {
                const active = betType === t.id
                const disabled = t.id === 'system' && items.length < 3
                return (
                  <button
                    key={t.id}
                    disabled={disabled}
                    onClick={() => setBetType(t.id)}
                    className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${
                      active
                        ? 'bg-[var(--bg-card)] text-[var(--text-primary)] font-semibold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {t.label}
                  </button>
                )
              })}
                </div>
              )}
              {items.length > 1 && betType === 'accumulator' && (
                <p className="mt-1.5 text-[10px] text-[var(--text-secondary)]">
                  当前为串关，需全部选项命中方可获胜。
                </p>
              )}
            </div>

            {betType === 'system' && (
              <div className="mb-3 rounded-lg bg-[var(--bg-control)] p-2">
                <div className="flex gap-1 mb-2">
                  {systemTypes.map((t) => {
                    const active = systemType === t.id
                    const meta = getSystemMeta(t.id)
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSystemType(t.id)}
                        className={`flex-1 text-[10px] py-1.5 rounded-md transition-colors ${
                          active
                            ? 'bg-[var(--bg-card)] text-[var(--text-primary)] font-semibold'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {t.label}
                        <span className="block font-normal opacity-70">{meta.requiredLegs} 项</span>
                      </button>
                    )
                  })}
                </div>
                {systemProjection && (
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
                    <span>
                      {systemProjection.label} 生成 {systemProjection.lineCount} 注，金额按单注计算
                    </span>
                    <span className="font-mono text-[var(--text-primary)]">
                      Σ {formatOdds(systemProjection.totalOdds, oddsFormat)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {isMatchEnded && matchStatus && hasCurrentMatchItems && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-400 font-medium">
                  {STATUS_MESSAGES[matchStatus] ?? '比赛已结束'}
                </p>
              </div>
            )}

            {/* Items */}
            <div className="space-y-3 mb-4">
              {groups.map((g) => {
                const isCurrent = g.matchId === currentMatchId
                return (
                  <div key={g.matchId}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] truncate">
                        {isCurrent ? '当前场' : '其他比赛'} · {g.matchLabel}
                      </p>
                      {!isCurrent && (
                        <button
                          onClick={() => clearMatch(g.matchId)}
                          className="text-[10px] text-[var(--text-secondary)] hover:text-[#E85A7E] transition-colors ml-2 shrink-0"
                        >
                          移除
                        </button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {g.items.map((item) => {
                        const match = getMatchById(item.matchId)
                        const matchEnded = !match || ENDED_STATUSES.has(match.status)
                        const isSuspended =
                          unavailableItemIds.has(item.id) ||
                          (isCurrent && suspendedMarkets?.has(item.marketTitle))
                        const disabledCtx = isSuspended || matchEnded
                        const oddsChanged = item.oddsCurrent !== item.oddsAtAdd
                        const oddsUp = item.oddsCurrent > item.oddsAtAdd
                        // 按 acceptPolicy 决定是否需要手工接受
                        const needsAccept =
                          oddsChanged &&
                          (acceptPolicy === 'none' ||
                            (acceptPolicy === 'higher_only' && !oddsUp))
                        const lockRemain = lockCountdown[item.id] ?? 0
                        const quoteExpired = item.quoteState === 'needs_refresh' || lockRemain === 0

                        return (
                          <div
                            key={item.id}
                            className={`bg-[var(--bg-control)] rounded-lg p-3 relative group ${disabledCtx ? 'opacity-50' : ''}`}
                          >
                            <button
                              onClick={() => removeById(item.id)}
                              className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--border)] text-[var(--text-secondary)] hover:bg-[#E85A7E] hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-xs"
                              aria-label="移除选项"
                            >
                              ×
                            </button>
                            <p className="text-xs text-[var(--text-primary)] mb-0.5 pr-6">{item.marketTitle}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-[#2DD4BF]">{item.selection}</span>
                              <span className="text-sm font-bold font-mono text-[var(--text-primary)]">
                                {formatOdds(item.oddsCurrent, oddsFormat)}
                              </span>
                            </div>
                            {oddsChanged && (
                              <div className="mt-1.5 flex items-center justify-between">
                                <span className={`text-[10px] ${oddsUp ? 'text-emerald-400' : 'text-red-400'}`}>
                                  赔率 {formatOdds(item.oddsAtAdd, oddsFormat)} → {formatOdds(item.oddsCurrent, oddsFormat)}
                                </span>
                                {needsAccept && (
                                  <button
                                    onClick={() => acceptOddsChange(item.id)}
                                    className="text-[10px] px-2 py-0.5 rounded bg-[#2DD4BF]/15 text-[#2DD4BF] hover:bg-[#2DD4BF]/25 transition-colors"
                                  >
                                    接受变化
                                  </button>
                                )}
                              </div>
                            )}
                            {!isSuspended && (
                              <p className={`mt-1 text-[10px] font-mono ${quoteExpired ? 'text-amber-400' : 'text-[var(--text-secondary)]'}`}>
                                {quoteExpired ? '报价已过期，请重新确认' : `报价有效 ${lockRemain}s`}
                              </p>
                            )}
                            {isSuspended && (
                              <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-400">
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="12" y1="8" x2="12" y2="12" />
                                  <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {matchEnded ? '比赛不可用' : '盘口已关闭'}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Total odds + leg counter */}
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-3 pb-3 border-b border-[var(--border)]">
              <span>
                {items.length > 1 ? (groups.length > 1 ? '总赔率（跨场）' : '总赔率（同场）') : '单式赔率'}
                <span className="ml-2 text-[10px]">
                  投注项 {items.length}/{BETTING_LIMITS.maxLegs}
                </span>
              </span>
              <span className="font-mono font-semibold text-[var(--text-primary)]">
                {formatOdds(displayOdds, oddsFormat)}
              </span>
            </div>

            {/* Quick stakes */}
            <QuickStakes
              balance={balance}
              onPick={(v) => setAmount(String(v))}
            />

            <Input
              label="投注金额"
              type="number"
              placeholder="0.00"
              suffix="USDT"
              min={BETTING_LIMITS.minStake}
              max={BETTING_LIMITS.maxStake}
              step={BETTING_LIMITS.stakeStep}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mb-3"
            />

            {/* Returns */}
            <div className="space-y-1 mb-3">
              {systemProjection && (
                <Row label="总投注额" value={`${fmtMoney(totalStake)} USDT`} />
              )}
              <Row label="可能返还" value={`${fmtMoney(potentialReturn)} USDT`} highlight />
              <Row label="可能净盈利" value={`${potentialProfit >= 0 ? '+' : ''}${fmtMoney(potentialProfit)} USDT`} />
              {items.length > 1 && (
                <p className="text-[10px] text-[var(--text-secondary)] pt-1">
                  最大可能返还封顶 {BETTING_LIMITS.maxReturn.toLocaleString('en-US')} USDT
                </p>
              )}
            </div>

            {hasStaleQuote && (
              <div className="mb-3 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 flex items-center justify-between gap-2">
                <span className="text-[10px] text-amber-300">
                  有报价已过期，提交前需要重新确认当前赔率。
                </span>
                <button
                  onClick={acceptAllOddsChanges}
                  className="shrink-0 text-[10px] px-2 py-1 rounded bg-[#2DD4BF]/15 text-[#2DD4BF] hover:bg-[#2DD4BF]/25 transition-colors"
                >
                  接受当前赔率
                </button>
              </div>
            )}

            <Button
              fullWidth
              onClick={handlePrimaryClick}
              disabled={
                submitting ||
                hasUnavailableInSlip ||
                (isMatchEnded && hasCurrentMatchItems) ||
                !legsInRange ||
                stake < BETTING_LIMITS.minStake
              }
            >
              {submitting
                ? '提交中…'
                : hasUnavailableInSlip
                  ? '包含不可用选项'
                  : isMatchEnded && hasCurrentMatchItems
                    ? '当前比赛已结束'
                    : !legsInRange
                      ? betType === 'system'
                        ? `${getSystemMeta(systemType).label} 需要 ${minLegs} 个投注项`
                        : betType === 'accumulator'
                        ? '串关至少需要 2 个投注项'
                        : '请调整投注项数量'
                      : '确认投注'}
            </Button>
          </>
        )}
      </div>

      <ConfirmBetDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doPlaceBet}
        items={items}
        betType={betType}
        systemType={betType === 'system' ? systemType : undefined}
        stake={stake}
        totalStake={totalStake}
        totalOdds={displayOdds}
        potentialReturn={potentialReturn}
        submitting={submitting}
      />
    </>
  )
}

function BalanceBadge({ balance, locked }: { balance: number; locked: number }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px]">
      <span className="text-[var(--text-secondary)]">余额</span>
      <span className="font-mono font-semibold text-[var(--text-primary)]">
        {fmtMoney(balance)} USDT
      </span>
      {locked > 0 && (
        <span className="text-[var(--text-secondary)]">未结算 {fmtMoney(locked)}</span>
      )}
      <button
        disabled
        className="ml-1 px-1.5 py-0.5 rounded bg-[var(--bg-control)] text-[var(--text-secondary)] text-[10px] cursor-not-allowed"
        title="充值功能暂未开放"
      >
        + 充值
      </button>
    </div>
  )
}

function QuickStakes({ balance, onPick }: { balance: number; onPick: (value: number) => void }) {
  const quick = useSettingsStore((s) => s.quickStakes)
  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {quick.map((v) => (
        <button
          key={v}
          onClick={() => onPick(v)}
          disabled={v > balance}
          className="text-[10px] px-2 py-1 rounded-md bg-[var(--bg-control)] hover:bg-[var(--border)] text-[var(--text-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {v.toLocaleString('en-US')}
        </button>
      ))}
      <button
        onClick={() => onPick(+balance.toFixed(2))}
        disabled={balance <= 0}
        className="text-[10px] px-2 py-1 rounded-md bg-[var(--bg-control)] hover:bg-[var(--border)] text-[var(--text-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        最大
      </button>
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span
        className={`font-mono ${highlight ? 'text-[#2DD4BF] font-semibold' : 'text-[var(--text-primary)]'}`}
      >
        {value}
      </span>
    </div>
  )
}
