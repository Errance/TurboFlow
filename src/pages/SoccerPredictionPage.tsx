/**
 * v4.5 预测大赛对阵树详情页。
 *
 * 路径：`/soccer/predictions/:tournamentId`
 *
 * 四块布局：
 * 1. 顶部赛事头：赛事名 + 状态徽标 + 奖金池总额 + 抽水 + 入场费 + 锁定倒计时 + 参赛人数 + 全员总分 + 资金锁定带 + 教学按钮
 * 2. 教学卡片（首次进入弹一次，后续可手动打开）：3 步说明 + 数字示例
 * 3. 主区对阵树：横向布局 R16 → QF → SF → F；每个 slot 显示双方 + 用户预测占比 + 可点击下拉
 * 4. 右栏「我的预测」：进度 + tiebreaker 输入 + 投影派奖 + 提交/编辑/撤回/分享按钮
 * 5. 底部「全员得分榜」前 100 + 本人置顶 + 链接到完整榜单页
 *
 * 设计意图：
 * - 用户必须能看到 wisdom of crowds 信号才提交
 * - 资金锁定提示醒目，三处展示
 * - 下游 slot 在上游未填时禁用并提示
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import PredictionConfirmDialog from '../components/soccer/PredictionConfirmDialog'
import PredictionShareDialog from '../components/soccer/PredictionShareDialog'
import { useSoccerBracketEntryStore } from '../stores/soccerBracketEntryStore'
import { useToastStore } from '../stores/toastStore'
import {
  bracketTournaments,
  formatLockCountdown,
  getBracketTournamentById,
  getRoundWeights,
  projectPayout,
  sampleEntries,
  sampleLeaderboard,
  sampleSelfRunningRow,
  scoreEntry,
  teamLabel,
  DEFAULT_ATTRIBUTION,
  describeAttribution,
  type BracketRoundId,
  type BracketSlot,
  type BracketTournament,
  type LeaderboardRow as LeaderboardRowType,
  type UserBracketEntry,
} from '../data/soccer/bracketData'

const TEACHING_KEY_PREFIX = 'tf-pool-teaching-'

export default function SoccerPredictionPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const storeEntry = useSoccerBracketEntryStore((s) => s.entries[tournamentId ?? ''])
  const updateDraft = useSoccerBracketEntryStore((s) => s.updateDraft)
  const submitEntry = useSoccerBracketEntryStore((s) => s.submitEntry)
  const saveEntry = useSoccerBracketEntryStore((s) => s.saveEntry)
  const withdrawEntry = useSoccerBracketEntryStore((s) => s.withdrawEntry)
  const createShareSnapshot = useSoccerBracketEntryStore((s) => s.createShareSnapshot)

  const tournament = useMemo<BracketTournament>(() => {
    return (
      getBracketTournamentById(tournamentId ?? '') ??
      bracketTournaments[0]
    )
  }, [tournamentId])

  const initialEntry = useMemo<UserBracketEntry | undefined>(() => {
    if (storeEntry) return storeEntry
    if (tournament.status === 'settled') {
      return sampleEntries.find((e) => e.tournamentId === tournament.id && e.status === 'settled')
    }
    if (tournament.status === 'running' || tournament.status === 'locked') {
      return sampleEntries.find((e) => e.tournamentId === tournament.id && e.totalScore !== undefined)
    }
    return undefined
  }, [storeEntry, tournament])

  const [picks, setPicks] = useState<Record<string, string>>(initialEntry?.picks ?? {})
  const [tiebreakerGuess, setTiebreakerGuess] = useState<number | undefined>(
    initialEntry?.tiebreakerGuess,
  )
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(
    initialEntry?.status === 'submitted' ||
      initialEntry?.status === 'locked' ||
      initialEntry?.status === 'settled',
  )
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareEntry, setShareEntry] = useState<UserBracketEntry | null>(null)
  const [teachingOpen, setTeachingOpen] = useState(false)

  useEffect(() => {
    setPicks(initialEntry?.picks ?? {})
    setTiebreakerGuess(initialEntry?.tiebreakerGuess)
    setHasSubmitted(
      initialEntry?.status === 'submitted' ||
        initialEntry?.status === 'locked' ||
        initialEntry?.status === 'settled',
    )
  }, [initialEntry?.id, initialEntry?.status, tournament.id])

  // 首次进入弹一次教学卡片
  useEffect(() => {
    if (typeof window === 'undefined') return
    const key = TEACHING_KEY_PREFIX + tournament.id
    const seen = window.localStorage.getItem(key)
    if (!seen) {
      setTeachingOpen(true)
    }
  }, [tournament.id])

  const handleCloseTeaching = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TEACHING_KEY_PREFIX + tournament.id, '1')
    }
    setTeachingOpen(false)
  }

  const hasTimeLocked = Date.now() >= new Date(tournament.lockAt).getTime()
  const isReadonly =
    tournament.status === 'locked' ||
    tournament.status === 'running' ||
    tournament.status === 'settled' ||
    tournament.status === 'cancelled' ||
    tournament.status === 'upcoming' ||
    hasTimeLocked

  // 计算每个 slot 的可选两支队伍（R16 直接看 candidates；上游看子 slot 已选）
  const candidatesForSlot = (slot: BracketSlot): [string, string] | null => {
    if (slot.candidates) return slot.candidates
    if (!slot.childSlotIds) return null
    const a = picks[slot.childSlotIds[0]]
    const b = picks[slot.childSlotIds[1]]
    if (!a || !b) return null
    return [a, b]
  }

  const slotsByRound: Record<BracketRoundId, BracketSlot[]> = useMemo(() => {
    const map: Record<BracketRoundId, BracketSlot[]> = {
      R16: [],
      QF: [],
      SF: [],
      F: [],
    }
    for (const s of tournament.slots) map[s.round].push(s)
    return map
  }, [tournament.slots])

  const filledCount = Object.keys(picks).length
  const totalSlots = tournament.slots.length

  const weights = getRoundWeights()
  const liveScore = useMemo(() => {
    if (tournament.status === 'running' || tournament.status === 'settled') {
      // 进行中或已结算时按 mock 已结算结果计分（picks 不变化）
      const baselineEntry = sampleEntries.find(
        (e) => e.tournamentId === tournament.id && e.totalScore !== undefined,
      )
      return baselineEntry?.totalScore ?? 0
    }
    return scoreEntry(picks, {}, tournament.slots, weights).totalScore
  }, [picks, tournament, weights])

  const projectedSelfPayout = useMemo(() => {
    const score = liveScore || 0
    return projectPayout(score, tournament.poolSnapshot.aggregateScore, tournament.poolSnapshot.netPool)
  }, [liveScore, tournament])

  const handlePick = (slotId: string, teamId: string) => {
    if (isReadonly) return
    setPicks((prev) => {
      const next = { ...prev }
      // 如果改了一个 slot 的选择，下游所有依赖此 slot 的 slot 都要清空
      const cleared = clearDownstream(slotId, next, tournament.slots)
      cleared[slotId] = teamId
      updateDraft({ tournamentId: tournament.id, picks: cleared, tiebreakerGuess })
      return cleared
    })
  }

  const handleSubmit = () => {
    if (filledCount < totalSlots) {
      addToast({
        type: 'error',
        message: `还有 ${totalSlots - filledCount} 个 slot 未填，请补齐后提交`,
      })
      return
    }
    if (tiebreakerGuess === undefined) {
      addToast({ type: 'error', message: '请填写决赛总进球数预测' })
      return
    }
    if (hasSubmitted) {
      saveEntry({ tournamentId: tournament.id, picks, tiebreakerGuess })
      addToast({ type: 'success', message: '预测已保存，入场费不重复扣除。' })
      return
    }
    setConfirmOpen(true)
  }

  const handleConfirmSubmit = () => {
    submitEntry({ tournamentId: tournament.id, picks, tiebreakerGuess })
    setConfirmOpen(false)
    setHasSubmitted(true)
    addToast({
      type: 'success',
      message: `已提交预测，扣除入场费 ${tournament.entryFee.toFixed(2)} ${tournament.currency}。锁前可全额撤回。`,
    })
  }

  const handleWithdraw = () => {
    if (!window.confirm('确认锁前撤回？入场费将退回钱包，并清空当前预测。')) return
    withdrawEntry(tournament.id)
    setHasSubmitted(false)
    setPicks({})
    setTiebreakerGuess(undefined)
    addToast({
      type: 'success',
      message: `已撤回预测，${tournament.entryFee.toFixed(2)} ${tournament.currency} 已退回钱包`,
    })
  }

  const handleShare = () => {
    const snapshot = createShareSnapshot(tournament.id, settledEntryForShare)
    if (snapshot) {
      setShareEntry(snapshot)
      setShareOpen(true)
      return
    }
    setShareEntry(settledEntryForShare)
    setShareOpen(true)
  }

  const settledEntryForShare: UserBracketEntry = useMemo(() => {
    return {
      id: 'self-current',
      tournamentId: tournament.id,
      userName: '我',
      picks,
      tiebreakerGuess,
      status: hasSubmitted ? 'submitted' : 'draft',
      submittedAt: hasSubmitted ? new Date().toISOString() : undefined,
      shareId: undefined,
      totalScore: liveScore || undefined,
      projectedPayout: projectedSelfPayout || undefined,
      scoreShare:
        tournament.poolSnapshot.aggregateScore > 0 && liveScore
          ? liveScore / tournament.poolSnapshot.aggregateScore
          : undefined,
      attribution: storeEntry?.attribution ?? DEFAULT_ATTRIBUTION,
    }
  }, [picks, tiebreakerGuess, hasSubmitted, tournament, liveScore, projectedSelfPayout, storeEntry?.attribution])

  const distributionMap = useMemo(() => {
    const map: Record<string, { totalPicks: number; shares: Record<string, number>; frozen: boolean; capturedAt: string }> = {}
    for (const snap of tournament.distribution) {
      const shares: Record<string, number> = {}
      for (const s of snap.shares) shares[s.teamId] = s.pickShare
      map[snap.slotId] = { totalPicks: snap.totalPicks, shares, frozen: snap.frozen, capturedAt: snap.capturedAt }
    }
    return map
  }, [tournament.distribution])

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm min-h-[44px] mb-4">
        <button
          onClick={() => navigate('/soccer')}
          className="text-[var(--text-secondary)] hover:text-[#2DD4BF] transition-colors"
        >
          足球
        </button>
        <span className="text-[var(--text-secondary)]/40">›</span>
        <button
          onClick={() => navigate('/soccer?view=pools')}
          className="text-[var(--text-secondary)] hover:text-[#2DD4BF] transition-colors"
        >
          预测大赛
        </button>
        <span className="text-[var(--text-secondary)]/40">›</span>
        <span className="text-[var(--text-primary)] font-medium truncate">{tournament.shortName}</span>
      </nav>

      {/* Tournament header */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-[#2DD4BF] uppercase tracking-wider font-semibold">
                预测大赛
              </span>
              <StatusBadge status={tournament.status} />
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{tournament.name}</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{tournament.headline}</p>
            <p className="mt-2 text-[10px] text-[var(--text-secondary)] leading-4">
              TurboFlow 预测市场新板块 · 当前约 {tournament.growthContext.currentDau} DAU 站内轻量验证 · {tournament.growthContext.lightweightOpsLabel}
            </p>
          </div>
          <button
            onClick={() => setTeachingOpen(true)}
            className="rounded-lg border border-[#2DD4BF]/40 bg-[#2DD4BF]/10 px-3 py-2 text-xs text-[#2DD4BF] hover:bg-[#2DD4BF]/15 transition-colors"
          >
            如何派奖？
          </button>
        </div>

        {/* Stats grid */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
          <Stat label="入场费" value={`${tournament.entryFee} ${tournament.currency}`} />
          <Stat label="奖金池（净）" value={`${tournament.poolSnapshot.netPool.toLocaleString()} USDT`} />
          <Stat label="抽水" value={`${(tournament.rake * 100).toFixed(0)}%`} />
          <Stat label="参赛人数" value={tournament.poolSnapshot.entrants.toLocaleString()} />
          <Stat label="锁定倒计时" value={formatLockCountdown(tournament.lockAt)} />
        </div>

        <div className="mt-3 rounded-xl bg-[var(--bg-control)] px-4 py-3">
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">
            推广 / 邀请归因
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)] leading-5">
            {tournament.affiliatePolicy.label}；{tournament.invitePolicy.label}。分享预测表只记录回流来源，不覆盖你已有的推广码或邀请码归属。
          </p>
        </div>

        {/* Fund lock hint band */}
        <div className="mt-4 rounded-xl border border-[#FFB347]/40 bg-[#FFB347]/10 px-4 py-3">
          <p className="text-[10px] text-[#FFB347] uppercase tracking-wider font-semibold">
            资金锁定提示
          </p>
          <p className="mt-1 text-sm text-[var(--text-primary)] leading-5">{tournament.fundLockHint}</p>
        </div>
      </section>

      <div className="mt-4 flex flex-col lg:flex-row gap-4">
        {/* Bracket main area */}
        <div className="flex-1 min-w-0">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">对阵树预测</h2>
              <div className="text-right">
                <p className="text-[10px] text-[var(--text-secondary)]">
                  按命中率分奖，名次仅供展示
                </p>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  {tournament.lateStrategyLabel}
                </p>
              </div>
            </div>

            {tournament.slots.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  本届对阵树尚未确定，开放报名后展示完整树。
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex gap-3 min-w-fit">
                  {(['R16', 'QF', 'SF', 'F'] as BracketRoundId[]).map((round) => (
                    <div key={round} className="flex flex-col gap-2 w-56 shrink-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">
                          {tournament.rounds.find((r) => r.id === round)?.label}
                        </span>
                        <span className="text-[10px] text-[#2DD4BF] font-mono">
                          {weights[round]} pt
                        </span>
                      </div>
                      <div className="space-y-2">
                        {slotsByRound[round].map((slot) => {
                          const candidates = candidatesForSlot(slot)
                          const dist = distributionMap[slot.id]
                          return (
                            <SlotCard
                              key={slot.id}
                              slot={slot}
                              candidates={candidates}
                              picked={picks[slot.id]}
                              distribution={dist}
                              readonly={isReadonly}
                              onPick={(teamId) => handlePick(slot.id, teamId)}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Bottom leaderboard */}
          <section className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">全员得分榜</h2>
                <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                  按命中率分奖，名次仅供展示。
                </p>
              </div>
              <button
                onClick={() => navigate(`/soccer/predictions/${tournament.id}/leaderboard`)}
                className="text-xs text-[#2DD4BF] hover:opacity-80"
              >
                查看完整榜单 ›
              </button>
            </div>
            <LeaderboardSection tournamentId={tournament.id} />
          </section>
        </div>

        {/* Right panel: my prediction */}
        <aside className="w-full lg:w-[340px] shrink-0">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 lg:sticky lg:top-20">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">我的预测</h2>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
              {hasSubmitted ? '已提交，锁前可改可撤回' : '尚未提交，锁前可任意修改'}
            </p>
            <p className="mt-1 text-[10px] text-[var(--text-secondary)] leading-4">
              {describeAttribution(storeEntry?.attribution ?? DEFAULT_ATTRIBUTION)}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Stat label="完成度" value={`${filledCount} / ${totalSlots}`} />
              <Stat label="本人得分" value={liveScore > 0 ? `${liveScore} 分` : '—'} highlight />
            </div>

            <div className="mt-3 rounded-lg bg-[var(--bg-control)] px-3 py-2">
              <p className="text-[10px] text-[var(--text-secondary)]">投影派奖</p>
              <p className="mt-1 text-sm font-mono text-[#2DD4BF] font-semibold">
                {projectedSelfPayout > 0 ? `≈ ${projectedSelfPayout.toFixed(2)} USDT` : '—'}
              </p>
              {tournament.status === 'open' && (
                <p className="mt-0.5 text-[10px] text-[var(--text-secondary)]">
                  报名期仅作奖金池示例；真实投影在赛事进行中刷新。
                </p>
              )}
              {liveScore > 0 && tournament.poolSnapshot.aggregateScore > 0 && (
                <p className="mt-0.5 text-[10px] text-[var(--text-secondary)]">
                  占总分 {((liveScore / tournament.poolSnapshot.aggregateScore) * 100).toFixed(2)}%
                </p>
              )}
            </div>

            {/* Tiebreaker input */}
            <div className="mt-3">
              <label className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">
                {tournament.tiebreakerLabel}
              </label>
              <input
                type="number"
                min={0}
                max={20}
                value={tiebreakerGuess ?? ''}
                onChange={(e) => {
                  if (isReadonly) return
                  const v = e.target.value
                  const nextGuess = v === '' ? undefined : Number(v)
                  setTiebreakerGuess(nextGuess)
                  updateDraft({ tournamentId: tournament.id, picks, tiebreakerGuess: nextGuess })
                }}
                disabled={isReadonly}
                placeholder="例如 3"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-control)] px-3 py-2 text-sm font-mono text-[var(--text-primary)] focus:border-[#2DD4BF] focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* Action buttons */}
            <div className="mt-4 space-y-2">
              {tournament.status === 'open' && !hasSubmitted && (
                <Button variant="primary" fullWidth onClick={handleSubmit}>
                  提交预测（{tournament.entryFee} {tournament.currency}）
                </Button>
              )}
              {tournament.status === 'open' && hasSubmitted && (
                <>
                  <Button variant="primary" fullWidth onClick={handleSubmit}>
                    保存修改
                  </Button>
                  <Button variant="ghost" fullWidth onClick={handleWithdraw}>
                    锁前撤回（退还入场费）
                  </Button>
                </>
              )}
              {tournament.status === 'locked' && (
                <p className="text-center text-xs text-[var(--text-secondary)] py-2">
                  已锁定，等待第一场开赛
                </p>
              )}
              {tournament.status === 'running' && (
                <p className="text-center text-xs text-[var(--text-secondary)] py-2">
                  进行中，每场结算后刷新分数
                </p>
              )}
              {tournament.status === 'settled' && (
                <p className="text-center text-xs text-[var(--text-secondary)] py-2">
                  已结算，请前往「我的预测大赛」查看赛后回顾
                </p>
              )}
              {tournament.status === 'upcoming' && (
                <p className="text-center text-xs text-[var(--text-secondary)] py-2">
                  即将开放，敬请关注
                </p>
              )}
              {(hasSubmitted || tournament.status !== 'open') && (
                <Button variant="secondary" fullWidth onClick={handleShare}>
                  分享我的预测
                </Button>
              )}
            </div>

            {/* Fund lock reminder (compact) */}
            {(tournament.status === 'open' || tournament.status === 'locked') && (
              <p className="mt-3 text-[10px] text-[var(--text-secondary)] leading-4">
                ⚠ {tournament.fundLockHint}
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* Teaching modal */}
      <Modal isOpen={teachingOpen} onClose={handleCloseTeaching} title="3 步看懂派奖">
        <div className="space-y-3">
          {tournament.teachingCard.steps.map((step, idx) => (
            <div key={idx} className="rounded-xl bg-[var(--bg-control)] px-4 py-3">
              <p className="text-[10px] text-[#2DD4BF] uppercase tracking-wider font-semibold">
                第 {idx + 1} 步｜{step.title}
              </p>
              <p className="mt-1 text-sm text-[var(--text-primary)] leading-5">{step.body}</p>
            </div>
          ))}
          <div className="rounded-xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/5 px-4 py-3">
            <p className="text-[10px] text-[#2DD4BF] uppercase tracking-wider font-semibold">
              数字示例
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)] leading-5">
              假设你最终拿了 {tournament.teachingCard.worked_example.selfScore} 分，全员总分是{' '}
              {tournament.teachingCard.worked_example.aggregateScore.toLocaleString()} 分，净池是{' '}
              {tournament.teachingCard.worked_example.netPool.toLocaleString()} USDT。
              <br />
              你能拿到 ≈{' '}
              <span className="text-[#2DD4BF] font-mono font-semibold">
                {tournament.teachingCard.worked_example.payout.toFixed(2)} USDT
              </span>
              。
            </p>
          </div>
          <Button variant="primary" fullWidth onClick={handleCloseTeaching}>
            知道了，去填表
          </Button>
        </div>
      </Modal>

      <PredictionConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        tournament={tournament}
        picksCount={filledCount}
        totalSlots={totalSlots}
        tiebreakerGuess={tiebreakerGuess}
      />

      <PredictionShareDialog
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        tournament={tournament}
        entry={shareEntry ?? settledEntryForShare}
      />
    </div>
  )
}

// -----------------------------------------------------------------------------
// Slot card (single position in bracket)
// -----------------------------------------------------------------------------

interface SlotCardProps {
  slot: BracketSlot
  candidates: [string, string] | null
  picked?: string
  distribution?: { totalPicks: number; shares: Record<string, number>; frozen: boolean; capturedAt: string }
  readonly: boolean
  onPick: (teamId: string) => void
}

function SlotCard({ slot, candidates, picked, distribution, readonly, onPick }: SlotCardProps) {
  const disabled = !candidates
  const winnerId = slot.actualWinner

  if (disabled) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-control)]/30 px-3 py-3 text-center">
        <p className="text-[10px] text-[var(--text-secondary)] font-mono">{slot.id}</p>
        <p className="mt-1 text-[10px] text-[var(--text-secondary)] leading-4">
          先填上游 slot
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-control)]/40 p-2">
      <p className="text-[10px] text-[var(--text-secondary)] font-mono mb-1">{slot.id}</p>
      {distribution && (
        <p className="mb-1 text-[9px] text-[var(--text-secondary)]">
          {distribution.frozen ? '已冻结快照' : '延迟快照'} · {formatShortTime(distribution.capturedAt)}
        </p>
      )}
      <div className="space-y-1">
        {candidates.map((teamId) => {
          const isSelected = picked === teamId
          const isActualWinner = winnerId === teamId
          const share = distribution?.shares[teamId]
          return (
            <button
              key={teamId}
              onClick={() => !readonly && onPick(teamId)}
              disabled={readonly}
              className={`w-full rounded-md px-2 py-1.5 text-xs text-left transition-colors relative overflow-hidden ${
                isSelected
                  ? 'bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/50'
                  : isActualWinner
                  ? 'bg-[#FFB347]/15 text-[#FFB347] border border-[#FFB347]/40'
                  : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-transparent hover:border-[var(--border)]'
              } ${readonly ? 'cursor-default opacity-90' : ''}`}
            >
              {/* distribution bar background */}
              {share !== undefined && (
                <span
                  className="absolute inset-y-0 left-0 bg-[var(--text-secondary)]/8"
                  style={{ width: `${(share * 100).toFixed(1)}%` }}
                  aria-hidden
                />
              )}
              <span className="relative flex items-center justify-between">
                <span className="truncate">{teamLabel(teamId)}</span>
                {share !== undefined && (
                  <span className="text-[9px] font-mono text-[var(--text-secondary)]/80 shrink-0 ml-1">
                    {(share * 100).toFixed(0)}%
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Leaderboard section
// -----------------------------------------------------------------------------

function LeaderboardSection({ tournamentId }: { tournamentId: string }) {
  const tournamentRows = sampleLeaderboard.filter((row) => row.tournamentId === tournamentId)
  const top = tournamentRows.slice(0, 100)
  const selfInTop = top.some((r) => r.isSelf)
  const selfRow = sampleSelfRunningRow.tournamentId === tournamentId ? sampleSelfRunningRow : undefined
  return (
    <div>
      {!selfInTop && selfRow && (
        <div className="rounded-lg border border-[#2DD4BF]/40 bg-[#2DD4BF]/10 px-3 py-2 mb-2">
          <p className="text-[10px] text-[#2DD4BF] uppercase tracking-wider font-semibold mb-1">
            你的位置
          </p>
          <LeaderboardRow row={selfRow} />
        </div>
      )}
      <div className="space-y-1 max-h-[480px] overflow-y-auto">
        {top.map((row) => (
          <LeaderboardRow key={`${row.rankDisplay}-${row.userName}`} row={row} />
        ))}
      </div>
    </div>
  )
}

function formatShortTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function LeaderboardRow({ row }: { row: LeaderboardRowType }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs ${
        row.isSelf ? 'bg-[#2DD4BF]/10' : 'bg-[var(--bg-control)]/30 hover:bg-[var(--bg-control)]/60'
      }`}
    >
      <span className="w-8 shrink-0 font-mono text-[10px] text-[var(--text-secondary)]">
        #{row.rankDisplay}
      </span>
      <span className={`flex-1 truncate ${row.isSelf ? 'text-[#2DD4BF] font-semibold' : 'text-[var(--text-primary)]'}`}>
        {row.userName}
      </span>
      <span className="w-12 shrink-0 text-right font-mono text-[var(--text-primary)]">
        {row.totalScore} 分
      </span>
      <span className="w-16 shrink-0 text-right font-mono text-[10px] text-[var(--text-secondary)]">
        {(row.scoreShare * 100).toFixed(2)}%
      </span>
      <span className="w-20 shrink-0 text-right font-mono text-[10px] text-[#2DD4BF]">
        {row.projectedPayout.toFixed(2)}
      </span>
    </div>
  )
}

function StatusBadge({ status }: { status: BracketTournament['status'] }) {
  const cls =
    status === 'open'
      ? 'bg-[#2DD4BF]/15 text-[#2DD4BF]'
      : status === 'upcoming'
      ? 'bg-[var(--bg-control)] text-[var(--text-secondary)]'
      : status === 'locked'
      ? 'bg-[#3B82F6]/15 text-[#3B82F6]'
      : status === 'running'
      ? 'bg-[#E85A7E]/15 text-[#E85A7E]'
      : status === 'settled'
      ? 'bg-[#FFB347]/15 text-[#FFB347]'
      : 'bg-[var(--bg-control)] text-[var(--text-secondary)]'
  const label =
    status === 'open'
      ? '报名中'
      : status === 'upcoming'
      ? '即将开放'
      : status === 'locked'
      ? '已锁定'
      : status === 'running'
      ? '进行中'
      : status === 'settled'
      ? '已结算'
      : '已取消'
  return <span className={`rounded-full px-2 py-0.5 text-[10px] ${cls}`}>{label}</span>
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-[var(--bg-control)] px-3 py-2">
      <p className="text-[10px] text-[var(--text-secondary)]">{label}</p>
      <p
        className={`mt-1 text-sm font-mono ${
          highlight ? 'text-[#2DD4BF] font-semibold' : 'text-[var(--text-primary)]'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

// 清空所有依赖某 slot 的下游 slot picks。
function clearDownstream(
  changedSlotId: string,
  picks: Record<string, string>,
  slots: BracketSlot[],
): Record<string, string> {
  const next = { ...picks }
  const dependents = slots.filter(
    (s) => s.childSlotIds && (s.childSlotIds[0] === changedSlotId || s.childSlotIds[1] === changedSlotId),
  )
  for (const d of dependents) {
    if (next[d.id]) {
      delete next[d.id]
      // 递归清理它的下游
      const further = clearDownstream(d.id, next, slots)
      Object.keys(next).forEach((k) => delete next[k])
      Object.assign(next, further)
    }
  }
  return next
}
