/**
 * v4.5 预测大赛截图导出弹窗。
 *
 * 三个动作：
 * - 复制链接（mock shareId 的只读视图）
 * - 下载图片（mock 不实现真截图，用 SVG 卡片占位）
 * - 复制文案
 */

import { useMemo } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { useToastStore } from '../../stores/toastStore'
import type { BracketTournament, UserBracketEntry } from '../../data/soccer/bracketData'
import { describeAttribution, teamLabel } from '../../data/soccer/bracketData'

interface Props {
  isOpen: boolean
  onClose: () => void
  tournament: BracketTournament
  entry: UserBracketEntry
}

export default function PredictionShareDialog({ isOpen, onClose, tournament, entry }: Props) {
  const addToast = useToastStore((s) => s.addToast)

  const shareUrl = useMemo(() => {
    if (!entry.shareId) return ''
    const base = window.location.origin + import.meta.env.BASE_URL
    return `${base}soccer/predictions/share/${entry.shareId}`.replace(/\/+/g, '/').replace(':/', '://')
  }, [entry.shareId])

  const championPick = entry.picks['F-1']
  const championLabel = championPick ? teamLabel(championPick) : '未填'

  const shareText = useMemo(() => {
    const filled = Object.keys(entry.picks).length
    const total = tournament.slots.length
    return [
      `我在 TurboFlow 完成了《${tournament.shortName}》的预测大赛对阵树（${filled}/${total}）`,
      `预测冠军：${championLabel}`,
      `${tournament.tiebreakerLabel}：${entry.tiebreakerGuess ?? '—'}`,
      `一份对阵树预测，按命中率分奖 → ${shareUrl}`,
    ].join('\n')
  }, [tournament, entry, championLabel, shareUrl])

  const handleCopyLink = async () => {
    if (!shareUrl) {
      addToast({ type: 'error', message: '该 entry 暂无分享链接' })
      return
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      addToast({ type: 'success', message: '已复制分享链接' })
    } catch {
      addToast({ type: 'error', message: '复制失败，请手动复制链接' })
    }
  }

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      addToast({ type: 'success', message: '已复制分享文案' })
    } catch {
      addToast({ type: 'error', message: '复制失败，请手动复制文案' })
    }
  }

  const handleDownload = () => {
    addToast({
      type: 'info',
      message: '当前为 mock 导出预览，真实图片生成留给后续接入。',
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="分享我的预测" className="max-w-lg">
      <div className="space-y-4">
        <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[#2DD4BF]/10 to-[#3B82F6]/10 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] text-[#2DD4BF] uppercase tracking-wider font-semibold">
                {tournament.shortName}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)] truncate">
                我预测冠军：{championLabel}
              </h3>
              <p className="mt-1 text-[10px] text-[var(--text-secondary)]">
                {tournament.tiebreakerLabel}：{entry.tiebreakerGuess ?? '—'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-[var(--text-secondary)]">完成度</p>
              <p className="mt-1 text-base font-mono font-semibold text-[var(--text-primary)]">
                {Object.keys(entry.picks).length} / {tournament.slots.length}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-[var(--text-secondary)] truncate">
            {shareUrl || '—'}
          </p>
          <p className="mt-2 text-[10px] text-[var(--text-secondary)] leading-4">
            来源：{describeAttribution(entry.attribution)}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="secondary" onClick={handleCopyLink}>
            复制链接
          </Button>
          <Button variant="secondary" onClick={handleDownload}>
            导出预览
          </Button>
          <Button variant="secondary" onClick={handleCopyText}>
            复制文案
          </Button>
        </div>

        <p className="text-[10px] text-[var(--text-secondary)] leading-4">
          分享视图仅显示对阵树和当时的用户预测分布快照，不显示资金、入场费、投影派奖。分享访问只记录回流来源，不覆盖访问者已有的推广码或邀请码归属。
        </p>
      </div>
    </Modal>
  )
}
