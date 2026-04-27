import { useState } from 'react'
import type { EventStatusInfo } from '../types'
import Badge from './ui/Badge'
import Button from './ui/Button'

interface DisputePanelProps {
  statusInfo: EventStatusInfo
  onClose: () => void
}

const MOCK_DISPUTE_TIMELINE = [
  { label: '争议已提交', date: '2026年3月16日 08:00', done: true },
  { label: '证据收集中', date: '3月16日-18日', done: true },
  { label: '社区复核中', date: '3月18日-19日', done: false },
  { label: '最终处理结果', date: '预计3月20日', done: false },
]

export default function DisputePanel({ statusInfo, onClose }: DisputePanelProps) {
  const [evidenceSubmitted, setEvidenceSubmitted] = useState(false)
  const [evidenceText, setEvidenceText] = useState('')
  const [showEvidenceForm, setShowEvidenceForm] = useState(false)

  return (
    <div className="space-y-5">
      {/* Status */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="danger">争议处理中</Badge>
          <span className="text-xs text-[var(--text-secondary)]">更新时间：{statusInfo.updatedAt ? new Date(statusInfo.updatedAt).toLocaleDateString('zh-CN') : '最近更新'}</span>
        </div>
        <p className="text-sm text-[var(--text-primary)]">{statusInfo.reason}</p>
        {statusInfo.reasonDetail && (
          <p className="text-xs text-[var(--text-secondary)] mt-2">{statusInfo.reasonDetail}</p>
        )}
      </div>

      {/* Timeline */}
      <div>
        <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">争议处理进度</h4>
        <div className="space-y-0">
          {MOCK_DISPUTE_TIMELINE.map((step, i) => (
            <div key={step.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full mt-1 ${step.done ? 'bg-[#2DD4BF]' : 'bg-[var(--border)] border border-[var(--text-secondary)]'}`} />
                {i < MOCK_DISPUTE_TIMELINE.length - 1 && (
                  <div className={`w-px flex-1 my-0.5 ${step.done ? 'bg-[#2DD4BF]/30' : 'bg-[var(--border)]'}`} />
                )}
              </div>
              <div className="pb-4">
                <p className="text-xs text-[var(--text-primary)] font-medium">{step.label}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">{step.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arguments summary */}
      <div>
        <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">争议观点</h4>
        <div className="space-y-2">
          <div className="bg-[var(--bg-base)] rounded-lg p-3">
            <p className="text-xs text-[var(--text-secondary)] mb-1">原结算结果（是）</p>
            <p className="text-xs text-[var(--text-primary)]">已有报告确认 2026 年 3 月 15 日目标区域附近发生军事行动。</p>
          </div>
          <div className="bg-[var(--bg-base)] rounded-lg p-3">
            <p className="text-xs text-[var(--text-secondary)] mb-1">争议观点（否）</p>
            <p className="text-xs text-[var(--text-primary)]">多方来源显示打击目标位于伊拉克境内代理设施，并非合约规则所述的伊朗本土。</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {evidenceSubmitted ? (
        <div className="bg-[#2DD4BF]/10 border border-[#2DD4BF]/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-[#2DD4BF]" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
              <path d="M5.5 8l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs font-medium text-[#2DD4BF]">证据已提交</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">我们已记录你的证据，并会在社区复核阶段一并查看。</p>
        </div>
      ) : showEvidenceForm ? (
        <div className="space-y-3">
          <textarea
            className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[#2DD4BF]/50 resize-none"
            rows={3}
            placeholder="请提供证据或参考链接"
            value={evidenceText}
            onChange={(e) => setEvidenceText(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="ghost" fullWidth size="sm" onClick={() => setShowEvidenceForm(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              fullWidth
              size="sm"
              disabled={!evidenceText.trim()}
              onClick={() => setEvidenceSubmitted(true)}
            >
              提交
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth size="sm" onClick={() => setShowEvidenceForm(true)}>
            提交证据
          </Button>
          <Button variant="ghost" fullWidth size="sm" onClick={onClose}>
            关闭
          </Button>
        </div>
      )}
    </div>
  )
}
