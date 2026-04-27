import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useEventStore } from '../stores/eventStore'
import { useOrderbookStore } from '../stores/orderbookStore'
import { useToastStore } from '../stores/toastStore'
import { useParlayStore } from '../stores/parlayStore'
import type { PredictionEvent, Contract, EventStatusInfo } from '../types'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import SideDrawer from '../components/ui/SideDrawer'
import TradePanel from '../components/TradePanel'
import Orderbook from '../components/Orderbook'
import DisputePanel from '../components/DisputePanel'
import RefundBanner from '../components/RefundBanner'
import PriceChart from '../components/PriceChart'
import ParlayAddPopover from '../components/ParlayAddPopover'

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${v}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ── StatusBanner ────────────────────────────────────────────────

function StatusBanner({ statusInfo, onAction }: { statusInfo: EventStatusInfo; onAction?: (action: string) => void }) {
  const { status, subStatus, reason } = statusInfo
  if (status === 'OPEN' && subStatus === 'normal') return null

  const config: Record<string, { bg: string; border: string; text: string }> = {
    'OPEN-paused':      { bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/30', text: 'text-[#F59E0B]' },
    'CLOSED-normal':    { bg: 'bg-[#E85A7E]/10', border: 'border-[#E85A7E]/30', text: 'text-[#E85A7E]' },
    'RESOLVING-normal': { bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/30', text: 'text-[#F59E0B]' },
    'RESOLVING-disputed': { bg: 'bg-[#E85A7E]/10', border: 'border-[#E85A7E]/30', text: 'text-[#E85A7E]' },
    'RESOLVING-delayed': { bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/30', text: 'text-[#F59E0B]' },
    'SETTLED-normal':   { bg: 'bg-[#2DD4BF]/10', border: 'border-[#2DD4BF]/30', text: 'text-[#2DD4BF]' },
    'SETTLED-disputed': { bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/30', text: 'text-[#F59E0B]' },
    'CANCELLED-normal': { bg: 'bg-[var(--border)]', border: 'border-[var(--border)]', text: 'text-[var(--text-secondary)]' },
    'VOIDED-normal':    { bg: 'bg-[var(--border)]', border: 'border-[var(--border)]', text: 'text-[var(--text-secondary)]' },
  }

  const key = `${status}-${subStatus}`
  const style = config[key] ?? config['CLOSED-normal']

  const titleMap: Record<string, string> = {
    'OPEN-paused': '交易已暂停',
    'CLOSED-normal': '市场已关闭，等待结算',
    'RESOLVING-normal': '结算中',
    'RESOLVING-disputed': '结算争议处理中',
    'RESOLVING-delayed': '结算延迟',
    'SETTLED-normal': '已结算',
    'SETTLED-disputed': '结算后争议处理中',
    'CANCELLED-normal': '市场已取消',
    'VOIDED-normal': '市场已作废，全额退款',
  }

  return (
    <div className={`${style.bg} ${style.border} border rounded-xl p-4 mb-4`}>
      <p className={`${style.text} text-sm font-medium mb-1`}>{titleMap[key] ?? status}</p>
      {reason && <p className="text-xs text-[var(--text-secondary)]">{reason}</p>}
      {statusInfo.actionAvailable && statusInfo.actionAvailable.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {statusInfo.actionAvailable.map((action) => (
            <Button key={action} variant="ghost" size="sm" onClick={() => onAction?.(action)}>
              {actionLabel(action)}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    appeal: '提交申诉',
    view_dispute: '查看争议',
    request_settle: '申请结算',
    report_issue: '报告问题',
    view_refund: '查看退款',
    view_evidence: '查看证据',
  }
  return map[action] ?? action
}

function eventStatusLabel(status: string): string {
  const map: Record<string, string> = {
    OPEN: '开放',
    CLOSED: '已关闭',
    RESOLVING: '结算中',
    SETTLED: '已结算',
    CANCELLED: '已取消',
    VOIDED: '已作废',
    normal: '正常',
    paused: '已暂停',
    disputed: '争议处理中',
    delayed: '延迟处理',
  }
  return map[status] ?? status
}

// ── RulesSummaryCard ────────────────────────────────────────────

function RulesSummaryCard({ event }: { event: PredictionEvent }) {
  const [showFull, setShowFull] = useState(false)
  const closeLabel = `关闭时间 ${formatDate(event.timeline.closeDate)}${event.timeline.expectedSettleWindow ? ` / 预计 ${event.timeline.expectedSettleWindow} 内结算` : ''}`

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 mb-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">规则摘要</h3>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <svg className="w-4 h-4 text-[#2DD4BF] shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
            <path d="M2 14V2h12M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <span className="text-xs font-semibold text-[#2DD4BF]">判定对象</span>
            <p className="text-xs text-[var(--text-primary)] mt-0.5">{event.rulesMeasurement}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <svg className="w-4 h-4 text-[#2DD4BF] shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <span className="text-xs font-semibold text-[#2DD4BF]">时间</span>
            <p className="text-xs text-[var(--text-primary)] mt-0.5">{closeLabel}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <svg className="w-4 h-4 text-[#2DD4BF] shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <div>
            <span className="text-xs font-semibold text-[#2DD4BF]">结算来源</span>
            <p className="text-xs text-[var(--text-primary)] mt-0.5">{event.resolutionSource}</p>
          </div>
        </div>
      </div>
      {event.rulesDetail && (
        <>
          <button
            onClick={() => setShowFull(!showFull)}
            className="text-xs text-[#2DD4BF] mt-3 hover:underline"
          >
            {showFull ? '收起完整规则 ↑' : '查看完整规则 →'}
          </button>
          {showFull && (
            <div className="mt-3 bg-[var(--bg-base)] rounded-lg p-3">
              <p className="text-xs text-[#C0C0D0] whitespace-pre-line leading-relaxed">{event.rulesDetail}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── TimelinePayoutCard ──────────────────────────────────────────

function TimelinePayoutCard({ event }: { event: PredictionEvent }) {
  const { timeline } = event
  const stages = [
    { label: '已开放', date: timeline.openDate, done: true },
    { label: '关闭', date: timeline.closeDate, done: ['CLOSED', 'RESOLVING', 'SETTLED', 'CANCELLED', 'VOIDED'].includes(event.status) },
    { label: '已结算', date: timeline.settledDate ?? null, done: event.status === 'SETTLED' },
  ]

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 mb-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">时间线与返还</h3>

      {/* Timeline */}
      <div className="flex items-center gap-0 mb-4">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${stage.done ? 'bg-[#2DD4BF]' : 'bg-[var(--border)] border border-[var(--text-secondary)]'}`} />
              <span className="text-[10px] text-[var(--text-secondary)] mt-1">{stage.label}</span>
              {stage.date && (
                <span className="text-[10px] text-[var(--text-primary)] font-mono">{formatDate(stage.date)}</span>
              )}
            </div>
            {i < stages.length - 1 && (
              <div className={`flex-1 h-px mx-1 ${stage.done ? 'bg-[#2DD4BF]' : 'bg-[var(--border)]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Settlement window */}
      {timeline.expectedSettleWindow && (
        <p className="text-xs text-[var(--text-secondary)] mb-3">
          预计结算时间：{timeline.expectedSettleWindow}
        </p>
      )}

      {/* Payout explanation */}
      <div className="bg-[var(--bg-base)] rounded-lg p-3">
        <div className="flex justify-between text-xs">
          <span className="text-[var(--text-secondary)]">如果命中</span>
          <span className="text-[#2DD4BF] font-medium">每份返还 1 USDC</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-[var(--text-secondary)]">如果未命中</span>
          <span className="text-[#E85A7E] font-medium">每份返还 0 USDC</span>
        </div>
      </div>
    </div>
  )
}

// ── EventSummaryCard ────────────────────────────────────────────

function EventSummaryCard({ event }: { event: PredictionEvent }) {
  const [expanded, setExpanded] = useState(false)
  if (!event.summary && !event.keyPoints?.length) return null

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">事件摘要与要点</h3>
        <svg
          className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 16 16" fill="none"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {expanded && (
        <div className="mt-3 space-y-3">
          {event.summary && (
            <p className="text-xs text-[#C0C0D0] leading-relaxed">{event.summary}</p>
          )}
          {event.keyPoints && event.keyPoints.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#2DD4BF] mb-1.5">关键要点</p>
              <ul className="space-y-1.5">
                {event.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#C0C0D0]">
                    <span className="w-1 h-1 rounded-full bg-[#2DD4BF] mt-1.5 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── OutcomeModelHint ────────────────────────────────────────────

function OutcomeModelHint({ event }: { event: PredictionEvent }) {
  if (event.outcomeModel !== 'mutually-exclusive') return null
  return (
    <div className="bg-[var(--bg-control)] border border-[var(--border)] rounded-lg px-3 py-2 mb-4">
      <p className="text-xs text-[var(--text-secondary)]">
        <span className="text-[#F59E0B] font-medium">唯一结果市场：</span>
        仅一个选项会按“是”结算，其余选项按“否”结算。
        因买卖价差存在，“是”方向概率合计可能不等于 100%。
      </p>
    </div>
  )
}

// ── ContractTable ───────────────────────────────────────────────

function ContractTableRow({
  contract,
  event,
  isSelected,
  onSelect,
  disabled,
  isMutuallyExclusive,
}: {
  contract: Contract
  event: PredictionEvent
  isSelected: boolean
  onSelect: (contractId: string, side: 'YES' | 'NO') => void
  disabled: boolean
  isMutuallyExclusive?: boolean
}) {
  const navigate = useNavigate()
  const addLeg = useParlayStore((s) => s.addLeg)
  const hasLeg = useParlayStore((s) => s.hasLeg)
  const inParlay = hasLeg(contract.id)
  const noProb = Math.round((1 - contract.yesPrice) * 100)

  const handleAddParlay = (side: 'YES' | 'NO') => {
    addLeg({
      contractId: contract.id,
      eventId: event.id,
      side,
      price: side === 'YES' ? contract.yesPrice : contract.noPrice,
      eventTitle: event.title,
      contractLabel: contract.label,
    })
  }

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg min-h-[48px] transition-colors ${
        inParlay ? 'border-l-2 border-l-[#2DD4BF]' : ''
      } ${isSelected ? 'bg-[#2DD4BF]/5 border border-[#2DD4BF]/20' : 'hover:bg-[var(--border)]'}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--text-primary)] truncate">{contract.label}</p>
        {contract.settlementResult && (
          <Badge variant={contract.settlementResult === 'YES' ? 'success' : 'danger'} className="mt-0.5">
            {contract.settlementResult === 'YES' ? '是' : '否'}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] font-mono tabular-nums shrink-0">
        <span className={contract.change24h > 0 ? 'text-[#2DD4BF]' : contract.change24h < 0 ? 'text-[#E85A7E]' : ''}>
          {contract.change24h > 0 ? '+' : ''}{contract.change24h.toFixed(1)}%
        </span>
        <span className="hidden md:inline">{formatVolume(contract.volume)}</span>
      </div>

      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={() => !disabled && onSelect(contract.id, 'YES')}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium min-h-[36px] min-w-[56px] transition-colors ${
            disabled
              ? 'bg-[var(--border)] text-[var(--text-secondary)] cursor-not-allowed'
              : 'bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20'
          }`}
        >
          是 {contract.probability}%
        </button>
        <button
          onClick={() => !disabled && onSelect(contract.id, 'NO')}
          disabled={disabled}
          title={isMutuallyExclusive ? `选择“否”表示判断“${contract.label}”不会成为最终结果` : undefined}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium min-h-[36px] min-w-[56px] transition-colors ${
            disabled
              ? 'bg-[var(--border)] text-[var(--text-secondary)] cursor-not-allowed'
              : 'bg-[#E85A7E]/10 text-[#E85A7E] hover:bg-[#E85A7E]/20'
          }`}
        >
          否 {noProb}%
        </button>
        {/* Add to Parlay */}
        {!disabled && (
          <ParlayAddPopover
            yesPrice={contract.yesPrice}
            noPrice={contract.noPrice}
            probability={contract.probability}
            inParlay={inParlay}
            onAdd={handleAddParlay}
          />
        )}
        {/* CLOB icon */}
        <button
          onClick={() => navigate(`/contract/${contract.id}`)}
          className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[var(--text-secondary)] hover:text-[#2DD4BF] rounded-lg hover:bg-[var(--border)] transition-colors"
          title="高级交易"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="12" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
            <rect x="8" y="5" width="5" height="8" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── SpreadTooltip ───────────────────────────────────────────────

function SpreadNote({ event }: { event: PredictionEvent }) {
  if (event.contracts.length < 2) return null
  const totalYes = event.contracts.reduce((sum, c) => sum + c.probability, 0)
  return (
    <p className="text-[10px] text-[var(--text-secondary)] px-3 mt-1">
      “是”方向概率合计：{totalYes}%
      {totalYes !== 100 && '，差异来自买卖价差'}
    </p>
  )
}

// ── RequestSettlePanel ──────────────────────────────────────────

function RequestSettlePanel({ event }: { event: PredictionEvent }) {
  const [type, setType] = useState<'settle' | 'issue'>('settle')
  const [submitted, setSubmitted] = useState(false)
  const [details, setDetails] = useState('')

  const canRequestSettle = ['CLOSED', 'RESOLVING'].includes(event.status)
  if (!canRequestSettle) return null

  if (submitted) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-[#2DD4BF]" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6.5 10l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {type === 'settle' ? '结算申请已提交' : '问题反馈已提交'}
          </span>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          我们已记录你的{type === 'settle' ? '结算申请' : '问题反馈'}，团队会完成复核并更新事件状态。预计 24-48 小时内给出处理结果。
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 mb-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">申请处理</h3>
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setType('settle')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            type === 'settle'
              ? 'bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/40'
              : 'bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          申请结算
        </button>
        <button
          onClick={() => setType('issue')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            type === 'issue'
              ? 'bg-[#E85A7E]/20 text-[#E85A7E] border border-[#E85A7E]/40'
              : 'bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          反馈问题
        </button>
      </div>
      <p className="text-xs text-[var(--text-secondary)] mb-3">
        {type === 'settle'
          ? '如果你认为事件结果已经明确，可以提交结算申请，并在下方提供证据或参考链接。'
          : '如果该事件存在结算来源错误、数据延迟或规则口径不一致等问题，可以在下方反馈。'}
      </p>
      <textarea
        className="w-full bg-[#0D0D19] border border-[var(--border)] rounded-lg p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[#2DD4BF]/50 resize-none"
        rows={3}
        placeholder={type === 'settle' ? '请输入证据或参考链接' : '请描述你遇到的问题'}
        value={details}
        onChange={(e) => setDetails(e.target.value)}
      />
      <div className="flex items-center justify-between mt-3">
        <span className="text-[10px] text-[var(--text-secondary)]">
          当前状态：{eventStatusLabel(event.status)} / {eventStatusLabel(event.statusInfo.subStatus)}
        </span>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setSubmitted(true)}
        >
          提交
        </Button>
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const getEvent = useEventStore((s) => s.getEvent)
  const setTradeSelection = useEventStore((s) => s.setTradeSelection)
  const openTradePanel = useEventStore((s) => s.openTradePanel)
  const selectedContractId = useEventStore((s) => s.selectedContractId)
  const selectedSide = useEventStore((s) => s.selectedSide)
  const tradePanelOpen = useEventStore((s) => s.tradePanelOpen)
  const closeTradePanel = useEventStore((s) => s.closeTradePanel)

  const [disputeDrawerOpen, setDisputeDrawerOpen] = useState(false)
  const [appealDrawerOpen, setAppealDrawerOpen] = useState(false)
  const [appealSubmitted, setAppealSubmitted] = useState(false)
  const [appealText, setAppealText] = useState('')
  const addToast = useToastStore((s) => s.addToast)

  const event = getEvent(eventId ?? '')

  useEffect(() => {
    const contractParam = searchParams.get('contract')
    const sideParam = searchParams.get('side') as 'YES' | 'NO' | null
    if (contractParam && sideParam) {
      openTradePanel(contractParam, sideParam)
      setSearchParams({}, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!event || event.contracts.length === 0) return
    const inThisEvent =
      selectedContractId != null && event.contracts.some((contract) => contract.id === selectedContractId)
    if (!inThisEvent) {
      setTradeSelection(event.contracts[0].id, 'YES')
    }
  }, [event, selectedContractId, setTradeSelection])

  useEffect(() => {
    if (!selectedContractId || event?.status !== 'OPEN') return
    useOrderbookStore.getState().startDeltaStream(selectedContractId)
    return () => { useOrderbookStore.getState().stopDeltaStream() }
  }, [selectedContractId, event?.status])

  if (!event) {
    return (
      <div className="px-4 md:px-6 py-12 text-center">
        <p className="text-[var(--text-secondary)]">未找到该事件</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/')}>
          返回探索
        </Button>
      </div>
    )
  }

  const isDisabled = event.status !== 'OPEN' || event.statusInfo.subStatus === 'paused'
  const hasDispute = event.statusInfo.subStatus === 'disputed'
  const isRefundable = event.status === 'CANCELLED' || event.status === 'VOIDED'

  const handleSelectContract = (contractId: string, side: 'YES' | 'NO') => {
    if (window.innerWidth < 768) {
      openTradePanel(contractId, side)
      return
    }
    setTradeSelection(contractId, side)
  }

  const handleStatusAction = (action: string) => {
    if (action === 'view_dispute' || action === 'view_evidence') {
      setDisputeDrawerOpen(true)
    } else if (action === 'appeal') {
      setAppealDrawerOpen(true)
    } else if (action === 'view_refund') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      addToast({ type: 'info', message: '退款详情已在页面上方展示' })
    } else if (action === 'request_settle') {
      const settleSection = document.querySelector('[data-section="request-settle"]')
      settleSection?.scrollIntoView({ behavior: 'smooth' })
    } else if (action === 'report_issue') {
      const settleSection = document.querySelector('[data-section="request-settle"]')
      settleSection?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
      {/* Full-width header */}
      <div className="flex items-start gap-3 mb-4">
        <button
          onClick={() => navigate('/')}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--border)] transition-colors shrink-0 -ml-2"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">{event.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant={event.status === 'OPEN' ? 'success' : event.status === 'CANCELLED' ? 'danger' : 'neutral'}>
              {event.statusInfo.subStatus === 'paused' ? '已暂停' : event.status === 'OPEN' ? '开放' : event.status === 'RESOLVING' ? '结算中' : event.status === 'SETTLED' ? '已结算' : event.status === 'CANCELLED' ? '已取消' : event.status === 'VOIDED' ? '已作废' : event.status}
            </Badge>
            <span className="text-xs text-[var(--text-secondary)]">{event.category}</span>
            <span className="text-xs text-[var(--text-secondary)] font-mono">{formatVolume(event.totalVolume)} 成交量</span>
          </div>
        </div>
      </div>

      {/* Status banner */}
      <StatusBanner statusInfo={event.statusInfo} onAction={handleStatusAction} />

      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left main area */}
        <div className="flex-1">

          {/* Refund banner for cancelled/voided */}
          {isRefundable && (
            <RefundBanner statusInfo={event.statusInfo} totalVolume={event.totalVolume} />
          )}

          {/* Outcome model hint */}
          <OutcomeModelHint event={event} />

          {/* Contract table - primary action first */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">合约</h3>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-[#2DD4BF] bg-[#2DD4BF]/10 px-1.5 py-0.5 rounded"><span className="md:hidden">1 USDC/份</span><span className="hidden md:inline">返还：1 USDC/份</span></span>
                <span className="text-xs text-[var(--text-secondary)]">共 {event.contracts.length} 个</span>
              </div>
            </div>
            {!isDisabled && event.contracts.length > 0 && (
              <div className="flex items-center justify-between px-1 mb-2">
                <p className="text-[11px] text-[var(--text-secondary)]">点击“是 / 否”即可快捷下单</p>
                <button
                  onClick={() =>
                    openTradePanel(selectedContractId || event.contracts[0].id, selectedSide ?? 'YES')
                  }
                  className="md:hidden text-[11px] text-[#2DD4BF] hover:underline"
                >
                  快捷下单
                </button>
              </div>
            )}
            <div className="space-y-1">
              {event.contracts.map((contract) => (
                <ContractTableRow
                  key={contract.id}
                  contract={contract}
                  event={event}
                  isSelected={selectedContractId === contract.id}
                  onSelect={handleSelectContract}
                  disabled={isDisabled}
                  isMutuallyExclusive={event.outcomeModel === 'mutually-exclusive'}
                />
              ))}
            </div>
            <SpreadNote event={event} />
          </div>

          {/* Probability chart */}
          {event.contracts.length > 0 && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 mb-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">概率走势</h3>
              <PriceChart
                marketId={selectedContractId || event.contracts[0].id}
                className=""
              />
            </div>
          )}

          {/* Request settle / report issue panel */}
          <div data-section="request-settle">
            <RequestSettlePanel event={event} />
          </div>

          {hasDispute && (
            <div className="mb-6">
              <Button variant="secondary" size="sm" onClick={() => setDisputeDrawerOpen(true)}>
                查看争议详情
              </Button>
            </div>
          )}

          {/* Market context below trading actions */}
          <div className="mt-2">
            <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2">市场说明</p>
            <RulesSummaryCard event={event} />
            <TimelinePayoutCard event={event} />
            <EventSummaryCard event={event} />
          </div>
        </div>

        {/* Right trade panel + orderbook — desktop only */}
        <div className="hidden md:block w-[340px] shrink-0 sticky top-20 self-start space-y-4">
          <TradePanel event={event} />
          {selectedContractId && (
            <Orderbook
              isOpen={event.status === 'OPEN'}
              side={selectedSide ?? 'YES'}
              compact
            />
          )}
        </div>
      </div>

      {/* Mobile trade panel — BottomSheet */}
      {tradePanelOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-[var(--overlay-bg)]" onClick={closeTradePanel} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-card)] rounded-t-xl border-t border-[var(--border)] max-h-[85vh] overflow-y-auto animate-[slide-in-from-bottom_0.25s_ease-out]">
            <div className="w-10 h-1 bg-[var(--border)] rounded-full mx-auto mt-2 mb-3" />
            <div className="px-4 pb-6">
              <TradePanel event={event} />
            </div>
          </div>
        </div>
      )}

      {/* Dispute Detail Drawer */}
      <SideDrawer
        isOpen={disputeDrawerOpen}
        onClose={() => setDisputeDrawerOpen(false)}
        title="争议详情"
      >
        <DisputePanel statusInfo={event.statusInfo} onClose={() => setDisputeDrawerOpen(false)} />
      </SideDrawer>

      {/* Appeal Drawer */}
      <SideDrawer
        isOpen={appealDrawerOpen}
        onClose={() => setAppealDrawerOpen(false)}
        title="提交申诉"
      >
        <div className="space-y-4">
          {appealSubmitted ? (
            <div className="bg-[#2DD4BF]/10 border border-[#2DD4BF]/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-[#2DD4BF]" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M6.5 10l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-sm font-semibold text-[#2DD4BF]">申诉已提交</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                我们已记录你的申诉，复核团队会评估提交内容，并在 24-48 小时内回复。
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-[var(--text-secondary)]">
                如果你认为结算结果有误，请在下方说明原因并提供相关证据。
              </p>
              <div className="bg-[var(--bg-base)] rounded-lg p-3">
                <p className="text-xs text-[var(--text-secondary)] mb-1">当前状态</p>
                <p className="text-sm text-[var(--text-primary)]">{eventStatusLabel(event.statusInfo.status)} — {eventStatusLabel(event.statusInfo.subStatus)}</p>
                {event.statusInfo.reason && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{event.statusInfo.reason}</p>
                )}
              </div>
              <textarea
                className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[#2DD4BF]/50 resize-none"
                rows={4}
                placeholder="请描述申诉原因并提供证据"
                value={appealText}
                onChange={(e) => setAppealText(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="ghost" fullWidth size="sm" onClick={() => setAppealDrawerOpen(false)}>
                  取消
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  size="sm"
                  disabled={!appealText.trim()}
                  onClick={() => {
                    setAppealSubmitted(true)
                    addToast({ type: 'success', message: '申诉已提交' })
                  }}
                >
                  提交申诉
                </Button>
              </div>
            </>
          )}
        </div>
      </SideDrawer>
    </div>
  )
}
