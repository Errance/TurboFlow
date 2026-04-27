import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTraderById, mockPositions } from '../data/copyTrading'
import { useCopyTradingStore } from '../stores/copyTradingStore'
import { useToastStore } from '../stores/toastStore'
import FigmaPageLayout, { Hotspot } from '../components/copy/FigmaPageLayout'
import CopySettingsModal from '../components/copy/CopySettingsModal'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'


export default function CopyTraderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('positions')
  const [stopCopyOpen, setStopCopyOpen] = useState(false)
  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const { followingIds, removeFollowing, addFollowing } = useCopyTradingStore()
  const addToast = useToastStore((s) => s.addToast)

  const trader = id ? getTraderById(id) : undefined
  const isFollowing = id ? followingIds.includes(id) : false

  const handleStopCopying = () => {
    if (id) {
      removeFollowing(id)
      setStopCopyOpen(false)
      addToast({ type: 'info', message: '已停止跟单' })
      navigate('/copy')
    }
  }

  const handleConfirmCopy = () => {
    if (id) addFollowing(id)
    setCopyModalOpen(false)
  }

  if (!trader) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-[var(--text-secondary)] mb-4">未找到该交易员</p>
        <Button variant="secondary" onClick={() => navigate('/copy')}>
          返回跟单广场
        </Button>
      </div>
    )
  }

  const src = '/figma/copy-trader-detail.png'

  return (
    <div className="max-w-[1920px] mx-auto px-4 py-6 md:px-6">
      <FigmaPageLayout imageSrc={src}>
        {/* 返回 + Portfolios：约 15% 12% 起，宽 20% 高 4% */}
        <Hotspot left={12} top={6} width={22} height={5} title="返回" onClick={() => navigate('/copy')} />
        {/* 星标：约 81.5% 14% 宽 3% 高 2.2% */}
        <Hotspot left={81.5} top={14.4} width={2.8} height={2.2} title="收藏" onClick={() => addToast({ type: 'info', message: '已收藏' })} />
        {/* 分享：约 85% 14% */}
        <Hotspot left={85.2} top={14.4} width={1.7} height={2.2} title="分享" onClick={() => addToast({ type: 'info', message: '分享链接已准备' })} />
        {/* 跟单或停止跟单按钮：约 79% 18% 宽 8% 高 3% */}
        {isFollowing ? (
          <Hotspot left={79} top={17.8} width={8} height={3.1} title="停止跟单" onClick={() => setStopCopyOpen(true)} />
        ) : (
          <Hotspot left={79} top={17.8} width={8} height={3.1} title="跟单" onClick={() => setCopyModalOpen(true)} />
        )}
        {/* Tab: 持仓 */}
        <Hotspot left={12.9} top={78.2} width={4.8} height={2} title="持仓" onClick={() => setActiveTab('positions')} />
        <Hotspot left={17.7} top={78.2} width={8} height={2} title="持仓历史" onClick={() => setActiveTab('positionHistory')} />
        <Hotspot left={25} top={78.2} width={6} height={2} title="交易历史" onClick={() => setActiveTab('tradeHistory')} />
        <Hotspot left={31.4} top={78.2} width={7} height={2} title="资金历史" onClick={() => setActiveTab('balanceHistory')} />
        <Hotspot left={38.7} top={78.2} width={6} height={2} title="跟单用户" onClick={() => setActiveTab('traders')} />
      </FigmaPageLayout>

      {/* Tab 下方：Positions 时展示真实表格，其余占位 */}
      {activeTab === 'positions' && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-[#353945]">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--text-tertiary)] border-b border-[#353945] bg-[var(--bg-card)]">
                <th className="pb-2 pt-3 px-3">交易对</th>
                <th className="pb-2 pt-3 px-3">持仓方向</th>
                <th className="pb-2 pt-3 px-3">规模</th>
                <th className="pb-2 pt-3 px-3">保证金</th>
                <th className="pb-2 pt-3 px-3">开仓均价</th>
                <th className="pb-2 pt-3 px-3">指数价格</th>
                <th className="pb-2 pt-3 px-3">未实现盈亏</th>
                <th className="pb-2 pt-3 px-3">收益率</th>
              </tr>
            </thead>
            <tbody className="text-[var(--text-primary)]">
              {mockPositions.map((row, i) => (
                <tr key={i} className="border-b border-[#353945]">
                  <td className="py-3 px-3">{row.pair} <span style={{ color: '#0abab5' }}>{row.leverage}</span></td>
                  <td className="py-3 px-3">{row.positionType}</td>
                  <td className="py-3 px-3">1,234.56</td>
                  <td className="py-3 px-3">123.45</td>
                  <td className="py-3 px-3">{row.avgEntryPrice}</td>
                  <td className="py-3 px-3">{row.avgIndexPrice}</td>
                  <td className="py-3 px-3" style={{ color: '#0abab5' }}>+12.34</td>
                  <td className="py-3 px-3" style={{ color: '#0abab5' }}>+12.34%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(activeTab === 'positionHistory' || activeTab === 'tradeHistory' || activeTab === 'balanceHistory' || activeTab === 'traders') && (
        <div className="mt-4 py-8 text-center text-[var(--text-secondary)] text-sm border border-[var(--border)] rounded-xl bg-[var(--bg-card)]">
          {activeTab === 'positionHistory' && '暂无持仓历史'}
          {activeTab === 'tradeHistory' && '暂无交易历史'}
          {activeTab === 'balanceHistory' && '暂无资金历史'}
          {activeTab === 'traders' && '暂无跟单用户'}
        </div>
      )}

      <CopySettingsModal
        open={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        traderId={id ?? ''}
        traderName={trader.nickname}
        onConfirm={handleConfirmCopy}
      />
      <Modal isOpen={stopCopyOpen} onClose={() => setStopCopyOpen(false)} title="确认停止跟单">
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          停止后不再跟随该交易员新订单，已有跟单仓位仍随其平仓。确定停止？
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setStopCopyOpen(false)}>取消</Button>
          <Button variant="danger" className="flex-1" onClick={handleStopCopying}>停止跟单</Button>
        </div>
      </Modal>
    </div>
  )
}
