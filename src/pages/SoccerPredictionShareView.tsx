/**
 * v4.5 预测大赛分享只读视图。
 *
 * 路径：`/soccer/predictions/share/:shareId`
 *
 * 显示：
 * - 对阵树 + 当时的用户预测分布快照
 * - 用户名、提交时间、tiebreaker 选择
 *
 * 不显示：
 * - 资金、入场费、本人得分、投影派奖
 *
 * 顶部 CTA："看完想自己来一份？立即参加"
 */

import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import { useSoccerBracketEntryStore } from '../stores/soccerBracketEntryStore'
import {
  bracketTournaments,
  describeAttribution,
  getEntryByShareId,
  teamLabel,
  type BracketRoundId,
  type BracketSlot,
  type BracketTournament,
  type UserBracketEntry,
} from '../data/soccer/bracketData'

export default function SoccerPredictionShareView() {
  const { shareId } = useParams<{ shareId: string }>()
  const navigate = useNavigate()
  const getShareSnapshot = useSoccerBracketEntryStore((s) => s.getShareSnapshot)

  const entry: UserBracketEntry | undefined = shareId
    ? (getShareSnapshot(shareId) ?? getEntryByShareId(shareId))
    : undefined
  const tournament: BracketTournament | undefined = entry
    ? bracketTournaments.find((t) => t.id === entry.tournamentId)
    : undefined

  const slots = tournament?.slots ?? []
  const distribution = tournament?.distribution ?? []

  const slotsByRound = useMemo(() => {
    const map: Record<BracketRoundId, BracketSlot[]> = { R16: [], QF: [], SF: [], F: [] }
    for (const s of slots) map[s.round].push(s)
    return map
  }, [slots])

  const distributionMap = useMemo(() => {
    const map: Record<string, { shares: Record<string, number>; frozen: boolean; capturedAt: string }> = {}
    for (const snap of distribution) {
      const shares: Record<string, number> = {}
      for (const s of snap.shares) shares[s.teamId] = s.pickShare
      map[snap.slotId] = { shares, frozen: snap.frozen, capturedAt: snap.capturedAt }
    }
    return map
  }, [distribution])

  if (!entry || !tournament) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-12 text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          分享链接已失效或不存在。
        </p>
        <Button variant="primary" className="mt-4" onClick={() => navigate('/soccer')}>
          返回足球首页
        </Button>
      </div>
    )
  }

  const champion = entry.picks['F-1']

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
      {/* CTA banner */}
      <div className="rounded-2xl border border-[#2DD4BF]/30 bg-gradient-to-br from-[#2DD4BF]/10 to-[#3B82F6]/10 px-5 py-4 mb-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] text-[#2DD4BF] uppercase tracking-wider font-semibold">
            预测大赛｜分享视图
          </p>
          <h1 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
            {entry.userName} 的 {tournament.shortName} 预测
          </h1>
          {entry.submittedAt && (
            <p className="mt-1 text-[10px] text-[var(--text-secondary)]">
              提交时间：{formatTime(entry.submittedAt)}
              {entry.tiebreakerGuess !== undefined &&
                ` · ${tournament.tiebreakerLabel}：${entry.tiebreakerGuess}`}
            </p>
          )}
          <p className="mt-1 text-[10px] text-[var(--text-secondary)] leading-4">
            分享页只记录回流来源，不覆盖访问者已有的推广码 / 邀请码归属。
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate(`/soccer/predictions/${tournament.id}`)}
        >
          看完想自己来一份？立即参加
        </Button>
      </div>

      {/* Champion highlight */}
      {champion && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 mb-4">
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">
            该用户预测冠军
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#2DD4BF]">{teamLabel(champion)}</p>
          <p className="mt-2 text-[10px] text-[var(--text-secondary)]">
            原 entry 来源：{describeAttribution(entry.attribution)}
          </p>
        </div>
      )}

      {/* Bracket */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">对阵树预测</h2>
          <p className="text-[10px] text-[var(--text-secondary)]">
            括号内为分享时的用户群体预测占比
          </p>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-3 min-w-fit">
            {(['R16', 'QF', 'SF', 'F'] as BracketRoundId[]).map((round) => (
              <div key={round} className="flex flex-col gap-2 w-56 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">
                    {tournament.rounds.find((r) => r.id === round)?.label}
                  </span>
                </div>
                <div className="space-y-2">
                  {slotsByRound[round].map((slot) => {
                    const candidates = candidatesForSlot(slot, entry.picks)
                    const dist = distributionMap[slot.id]
                    const picked = entry.picks[slot.id]
                    return (
                      <ReadonlySlotCard
                        key={slot.id}
                        slot={slot}
                        candidates={candidates}
                        picked={picked}
                        distribution={dist}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <p className="mt-4 text-[10px] text-[var(--text-secondary)] text-center">
        本视图仅展示对阵树和当时的用户预测分布快照，不显示资金或本人得分。访问者可按上方按钮加入预测大赛；如已有平台推广 / 邀请归属，将保持原归属。
      </p>
    </div>
  )
}

function candidatesForSlot(
  slot: BracketSlot,
  picks: Record<string, string>,
): [string, string] | null {
  if (slot.candidates) return slot.candidates
  if (!slot.childSlotIds) return null
  const a = picks[slot.childSlotIds[0]]
  const b = picks[slot.childSlotIds[1]]
  if (!a || !b) return null
  return [a, b]
}

function ReadonlySlotCard({
  slot,
  candidates,
  picked,
  distribution,
}: {
  slot: BracketSlot
  candidates: [string, string] | null
  picked?: string
  distribution?: { shares: Record<string, number>; frozen: boolean; capturedAt: string }
}) {
  if (!candidates) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-control)]/30 px-3 py-3 text-center">
        <p className="text-[10px] text-[var(--text-secondary)] font-mono">{slot.id}</p>
        <p className="mt-1 text-[10px] text-[var(--text-secondary)] leading-4">
          上游未填，无法显示
        </p>
      </div>
    )
  }
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-control)]/40 p-2">
      <p className="text-[10px] text-[var(--text-secondary)] font-mono mb-1">{slot.id}</p>
      {distribution && (
        <p className="mb-1 text-[9px] text-[var(--text-secondary)]">
          {distribution.frozen ? '已冻结' : '延迟快照'} · {formatShortTime(distribution.capturedAt)}
        </p>
      )}
      <div className="space-y-1">
        {candidates.map((teamId) => {
          const isSelected = picked === teamId
          const share = distribution?.shares[teamId]
          return (
            <div
              key={teamId}
              className={`relative overflow-hidden rounded-md px-2 py-1.5 text-xs border ${
                isSelected
                  ? 'bg-[#2DD4BF]/20 text-[#2DD4BF] border-[#2DD4BF]/50'
                  : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-transparent'
              }`}
            >
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
            </div>
          )
        })}
      </div>
    </div>
  )
}

function formatShortTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
