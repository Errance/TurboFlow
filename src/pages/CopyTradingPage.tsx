import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockTraders } from '../data/copyTrading'
import { useCopyTradingStore } from '../stores/copyTradingStore'
import FigmaPageLayout, { Hotspot } from '../components/copy/FigmaPageLayout'
import CopySettingsModal from '../components/copy/CopySettingsModal'
import type { CopyButtonState } from '../data/copyTrading'


/** 广场卡片网格热区：3 列 2 行，约 6 张卡片，百分比 (left, top, width, height) */
const CARD_GRID = [
  { left: 4, top: 28, width: 30, height: 22 },
  { left: 36, top: 28, width: 30, height: 22 },
  { left: 68, top: 28, width: 30, height: 22 },
  { left: 4, top: 52, width: 30, height: 22 },
  { left: 36, top: 52, width: 30, height: 22 },
  { left: 68, top: 52, width: 30, height: 22 },
]

export default function CopyTradingPage() {
  const navigate = useNavigate()
  const [settingsModal, setSettingsModal] = useState<{ open: boolean; traderId: string; traderName: string }>({
    open: false,
    traderId: '',
    traderName: '',
  })
  const { addFollowing } = useCopyTradingStore()

  const handleConfirmCopy = () => {
    if (settingsModal.traderId) addFollowing(settingsModal.traderId)
    setSettingsModal((s) => ({ ...s, open: false, traderId: '', traderName: '' }))
  }

  const traders = useMemo(() => mockTraders.slice(0, 6), [])

  const src = '/figma/copy-plaza.png'

  return (
    <div className="max-w-[1920px] mx-auto px-4 py-6 md:px-6">
      <FigmaPageLayout imageSrc={src}>
        {/* 我的跟单：Banner 右侧，约 72% 12% 宽 10% 高 3% */}
        <Hotspot left={72} top={10} width={10} height={3.2} title="我的跟单" onClick={() => navigate('/copy/my')} />
        {/* 申请成为交易员：约 84% 12% 宽 8% 高 3% */}
        <Hotspot left={84} top={10} width={8} height={3.2} title="申请成为交易员" onClick={() => {}} />
        {/* Tab 公域 / 私域 / 收藏：约 4% 18% 各约 6% 宽 2.5% 高 */}
        <Hotspot left={4} top={17} width={5} height={2.5} title="公域" onClick={() => {}} />
        <Hotspot left={10} top={17} width={5} height={2.5} title="私域" onClick={() => {}} />
        <Hotspot left={16} top={17} width={5} height={2.5} title="收藏" onClick={() => {}} />
        {/* 6 张卡片：点击整卡进入详情 */}
        {CARD_GRID.map((area, i) => {
          const t = traders[i]
          if (!t) return null
          return (
            <Hotspot
              key={t.id}
              left={area.left}
              top={area.top}
              width={area.width}
              height={area.height}
              title={t.nickname}
              onClick={() => navigate(`/copy/trader/${t.id}`)}
            />
          )
        })}
      </FigmaPageLayout>

      {/* 底图下方：保留可操作卡片网格，便于打开跟单设置弹窗 */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockTraders.map((trader) => (
          <PlazaCardRow
            key={trader.id}
            trader={trader}
            onOpenCopyModal={(id, name) => setSettingsModal({ open: true, traderId: id, traderName: name })}
            onNavigateDetail={(id) => navigate(`/copy/trader/${id}`)}
          />
        ))}
      </div>

      <CopySettingsModal
        open={settingsModal.open}
        onClose={() => setSettingsModal((s) => ({ ...s, open: false }))}
        traderId={settingsModal.traderId}
        traderName={settingsModal.traderName}
        onConfirm={handleConfirmCopy}
      />
    </div>
  )
}

function PlazaCardRow({
  trader,
  onOpenCopyModal,
  onNavigateDetail,
}: {
  trader: (typeof mockTraders)[0]
  onOpenCopyModal: (id: string, name: string) => void
  onNavigateDetail: (id: string) => void
}) {
  const { copyStates } = useCopyTradingStore()
  const state = (copyStates[trader.id] ?? trader.copyButton) as CopyButtonState
  const canCopy = state === 'Copy'

  return (
    <div
      className="p-4 rounded-xl border border-[#353945] cursor-pointer hover:opacity-95 transition-opacity"
      style={{ backgroundColor: 'var(--bg-card)' }}
      onClick={() => onNavigateDetail(trader.id)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-[var(--text-primary)]">{trader.nickname}</span>
        <span className="text-xs text-[var(--text-tertiary)]">{trader.followerCount} / {trader.followerMax}</span>
      </div>
      <p className="text-xs text-[var(--text-tertiary)] mb-2">180 日盈亏：<span style={{ color: '#0abab5' }}>+${trader.pnl180d.toLocaleString()}</span></p>
      <p className="text-xs text-[var(--text-tertiary)] mb-3">30 日收益率：<span style={{ color: '#0abab5' }}>{trader.roi30d}%</span></p>
      <button
        type="button"
        className="w-full h-10 rounded-lg font-medium text-base text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: '#0abab5' }}
        disabled={state === 'Copying' || state === 'Full'}
        onClick={(e) => {
          e.stopPropagation()
          if (canCopy) onOpenCopyModal(trader.id, trader.nickname)
        }}
      >
        {state === 'Copying' ? '跟单中' : state === 'Full' ? '名额已满' : '跟单'}
      </button>
    </div>
  )
}
