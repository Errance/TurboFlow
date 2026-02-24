import { useState } from 'react'
import type { EventStatusInfo } from '../types'
import Badge from './ui/Badge'
import Button from './ui/Button'

interface DisputePanelProps {
  statusInfo: EventStatusInfo
  onClose: () => void
}

const MOCK_DISPUTE_TIMELINE = [
  { label: 'Dispute Filed', date: 'Mar 16, 2026 08:00', done: true },
  { label: 'Evidence Collection', date: 'Mar 16–18', done: true },
  { label: 'Community Review', date: 'Mar 18–19', done: false },
  { label: 'Final Resolution', date: 'Expected Mar 20', done: false },
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
          <Badge variant="danger">Dispute Active</Badge>
          <span className="text-xs text-[var(--text-secondary)]">Updated {statusInfo.updatedAt ? new Date(statusInfo.updatedAt).toLocaleDateString() : 'recently'}</span>
        </div>
        <p className="text-sm text-[var(--text-primary)]">{statusInfo.reason}</p>
        {statusInfo.reasonDetail && (
          <p className="text-xs text-[var(--text-secondary)] mt-2">{statusInfo.reasonDetail}</p>
        )}
      </div>

      {/* Timeline */}
      <div>
        <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">Dispute Timeline</h4>
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
        <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Dispute Arguments</h4>
        <div className="space-y-2">
          <div className="bg-[var(--bg-base)] rounded-lg p-3">
            <p className="text-xs text-[var(--text-secondary)] mb-1">Original Resolution (YES)</p>
            <p className="text-xs text-[var(--text-primary)]">Reports confirm a US military operation occurred near the target area on March 15, 2026.</p>
          </div>
          <div className="bg-[var(--bg-base)] rounded-lg p-3">
            <p className="text-xs text-[var(--text-secondary)] mb-1">Dispute Argument (NO)</p>
            <p className="text-xs text-[var(--text-primary)]">Multiple sources indicate the strike targeted a proxy site on Iraqi territory, not Iranian soil as specified in the contract rules.</p>
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
            <span className="text-xs font-medium text-[#2DD4BF]">Evidence Submitted</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">Your evidence has been recorded and will be reviewed during the community review phase.</p>
        </div>
      ) : showEvidenceForm ? (
        <div className="space-y-3">
          <textarea
            className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[#2DD4BF]/50 resize-none"
            rows={3}
            placeholder="Provide your evidence or reference links..."
            value={evidenceText}
            onChange={(e) => setEvidenceText(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="ghost" fullWidth size="sm" onClick={() => setShowEvidenceForm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              size="sm"
              disabled={!evidenceText.trim()}
              onClick={() => setEvidenceSubmitted(true)}
            >
              Submit
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth size="sm" onClick={() => setShowEvidenceForm(true)}>
            Submit Evidence
          </Button>
          <Button variant="ghost" fullWidth size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  )
}
