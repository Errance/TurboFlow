import { useLocation, useNavigate } from 'react-router-dom'
import { useSoccerBetSlipStore } from '../../stores/soccerBetSlipStore'
import { useParlayStore } from '../../stores/parlayStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatOdds } from '../../utils/oddsFormat'

/**
 * 全局浮动 betSlip 入口：当 soccer 投注单不为空、但用户离开 SoccerMatchPage 时仍可见，
 * 点击跳回最近添加 item 所属的比赛详情页，避免跨页丢失选择。
 *
 * 与 Events 的 ParlayBar 共存时，竖直错位（ParlayBar 在 bottom-4，本 bar 向上偏一格）。
 */
export default function SoccerBetSlipFloat() {
  const navigate = useNavigate()
  const location = useLocation()
  const items = useSoccerBetSlipStore((s) => s.items)
  const parlayLegs = useParlayStore((s) => s.slip.length)
  const oddsFormat = useSettingsStore((s) => s.oddsFormat)

  if (items.length === 0) return null

  // 若当前已在 SoccerMatchPage（路径形如 /soccer/match/:id），该页右栏已有完整面板，不再显示浮动条
  if (location.pathname.startsWith('/soccer/match/')) return null

  const latestItem = items.reduce((a, b) => (a.addedAt > b.addedAt ? a : b))
  const totalOdds = items.reduce((acc, it) => acc * it.oddsCurrent, 1)
  const formattedOdds = formatOdds(totalOdds, oddsFormat)
  const hasOddsChanged = items.some((it) => it.oddsCurrent !== it.oddsAtAdd)
  const matchCount = new Set(items.map((it) => it.matchId)).size

  // ParlayBar（Events）同时存在时，把本条向上错位，避免重叠
  const hasParlay = parlayLegs > 0

  const handleOpen = () => {
    navigate(`/soccer/match/${latestItem.matchId}`)
  }

  return (
    <>
      {/* Mobile: above tab bar (若有 ParlayBar，进一步上移) */}
      <div
        onClick={handleOpen}
        className={`md:hidden fixed left-0 right-0 z-31 bg-[var(--bg-card)] border-t border-[#E85A7E]/30 px-4 flex items-center justify-between cursor-pointer min-h-[40px] hover:bg-[var(--bg-control)] transition-colors ${
          hasParlay ? 'bottom-[96px]' : 'bottom-[56px]'
        }`}
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[#E85A7E]">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v3l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-xs font-medium text-[var(--text-primary)]">足球投注单</span>
          <span className="text-[10px] bg-[#E85A7E]/10 text-[#E85A7E] px-1.5 py-0.5 rounded font-bold">
            {items.length}
          </span>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">{formattedOdds}</span>
          {hasOddsChanged && (
            <span className="text-[10px] text-amber-400">赔率已变动</span>
          )}
          {matchCount > 1 && (
            <span className="text-[10px] text-[var(--text-secondary)]">· {matchCount} 场</span>
          )}
        </div>
        <span className="text-xs text-[#E85A7E] font-medium">查看</span>
      </div>

      {/* Desktop: bottom-right, offset above ParlayBar when present */}
      <div
        onClick={handleOpen}
        className={`hidden md:flex fixed right-4 z-40 bg-[var(--bg-card)] border border-[#E85A7E]/30 rounded-xl px-4 py-3 items-center gap-3 cursor-pointer shadow-lg shadow-[#E85A7E]/10 hover:border-[#E85A7E]/60 transition-colors min-w-[240px] ${
          hasParlay ? 'bottom-[88px]' : 'bottom-4'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#E85A7E] shrink-0">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 5v3l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">足球投注单</span>
            <span className="text-[10px] bg-[#E85A7E]/10 text-[#E85A7E] px-1.5 py-0.5 rounded font-bold">
              {items.length} 项
            </span>
          </div>
          <span className="text-xs text-[var(--text-secondary)] font-mono">
            总赔率 {formattedOdds} {matchCount > 1 ? `· 跨 ${matchCount} 场` : ''}
          </span>
          {hasOddsChanged && <span className="text-[10px] text-amber-400">赔率已变动</span>}
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--text-secondary)] shrink-0">
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </>
  )
}
