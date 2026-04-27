import { useNavigate } from 'react-router-dom'
import { useCopyTradingStore } from '../stores/copyTradingStore'
import { getTraderById } from '../data/copyTrading'
import FigmaPageLayout, { Hotspot } from '../components/copy/FigmaPageLayout'

export default function MyCopyPage() {
  const navigate = useNavigate()
  const { followingIds, removeFollowing } = useCopyTradingStore()

  const followingTraders = followingIds
    .map((id) => getTraderById(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getTraderById>>[]

  const hasFollowing = followingTraders.length > 0
  const src = hasFollowing ? '/figma/copy-my.png' : '/figma/copy-my-empty.png'

  return (
    <div className="max-w-[1920px] mx-auto px-4 py-6 md:px-6">
      <FigmaPageLayout imageSrc={src} aspectRatio={1920 / (hasFollowing ? 1288 : 1080)}>
        {/* 返回 / 去跟单广场：左上或空态中央按钮，按设计稿约 10% 5% 宽 15% 高 4% */}
        <Hotspot left={8} top={4} width={14} height={4} title="返回" onClick={() => navigate('/copy')} />
        {/* 空态：去跟单广场按钮 约 40% 65% 宽 20% 高 5% */}
        {!hasFollowing && (
          <Hotspot left={40} top={65} width={20} height={5} title="去跟单广场" onClick={() => navigate('/copy')} />
        )}
        {/* 有跟单时：每条跟单项可做热区需动态数量，这里用下方列表补充；仅做「返回」热区 */}
      </FigmaPageLayout>

      {/* 有跟单时在底图下方展示可点击列表（与热区互补） */}
      {hasFollowing && (
        <div className="mt-6 space-y-4">
          {followingTraders.map((t) => (
            <div
              key={t.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border)]"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0 bg-[var(--border)] text-[var(--text-secondary)]">
                  {t.nickname.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{t.nickname}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">跟单时间：{t.copiedOn}</p>
                  <p className="text-xs mt-1">
                    <span style={{ color: 'var(--text-tertiary)' }}>未实现盈亏：</span>
                    <span style={{ color: '#E85A7E' }}>{t.unrealizedPnl}</span>
                    <span className="ml-3" style={{ color: 'var(--text-tertiary)' }}>已实现盈亏：</span>
                    <span style={{ color: '#0abab5' }}>{t.realizedPnl}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  className="h-8 px-3 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--border)]"
                  onClick={() => navigate(`/copy/trader/${t.id}`)}
                >
                  查看详情
                </button>
                <button
                  type="button"
                  className="h-8 px-3 rounded-lg text-sm font-medium border border-red-500/50 text-red-400 hover:bg-red-500/10"
                  onClick={() => removeFollowing(t.id)}
                >
                  停止跟单
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
