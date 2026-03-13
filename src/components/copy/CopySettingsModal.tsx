import { useState } from 'react'
import Modal from '../ui/Modal'

interface CopySettingsModalProps {
  open: boolean
  onClose: () => void
  traderId: string
  traderName: string
  onConfirm: () => void
}

export default function CopySettingsModal({
  open,
  onClose,
  traderName,
  onConfirm,
}: CopySettingsModalProps) {
  const [feeMode, setFeeMode] = useState<'Profit Share' | 'Flat Fee'>('Profit Share')
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="跟单设置" className="max-w-[400px]">
      <p className="text-sm text-[var(--text-secondary)] mb-4">跟随 {traderName} 的跟单参数（模拟）</p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-2">Fee Mode</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFeeMode('Profit Share')}
              className="flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors"
              style={{
                borderColor: feeMode === 'Profit Share' ? '#0abab5' : 'var(--border)',
                backgroundColor: feeMode === 'Profit Share' ? 'rgba(10,186,181,0.1)' : 'transparent',
                color: feeMode === 'Profit Share' ? '#0abab5' : 'var(--text-secondary)',
              }}
            >
              Profit Share
            </button>
            <button
              type="button"
              onClick={() => setFeeMode('Flat Fee')}
              className="flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors"
              style={{
                borderColor: feeMode === 'Flat Fee' ? '#0abab5' : 'var(--border)',
                backgroundColor: feeMode === 'Flat Fee' ? 'rgba(10,186,181,0.1)' : 'transparent',
                color: feeMode === 'Flat Fee' ? '#0abab5' : 'var(--text-secondary)',
              }}
            >
              Flat Fee
            </button>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          >
            {advancedOpen ? '收起' : '展开'}高级设置
          </button>
          {advancedOpen && (
            <div className="mt-2 p-3 rounded-lg border border-[var(--border)] text-xs text-[var(--text-secondary)]">
              <p className="mb-2">Existing Position Copy Mode（模拟）</p>
              <p>选择只跟单哪些交易对（模拟）</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--border)]"
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: '#0abab5' }}
        >
          确认跟单
        </button>
      </div>
    </Modal>
  )
}
