/**
 * 投注单设置下拉菜单：齿轮图标 → 弹层。
 *
 * 承载：
 * - 赔率格式（decimal / fractional / american）
 *
 * 设置保存到 settingsStore，持久化 tf_settings。
 * 点击外部关闭。
 */

import { useEffect, useRef, useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import type { OddsFormat } from '../../data/soccer/contracts'

const FORMAT_OPTIONS: { id: OddsFormat; label: string; hint: string }[] = [
  { id: 'decimal', label: '欧洲盘', hint: '示例 2.24' },
  { id: 'fractional', label: '分数盘', hint: '示例 31/25' },
  { id: 'american', label: '美式盘', hint: '示例 +124' },
]

export default function BetSlipSettingsMenu() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const oddsFormat = useSettingsStore((s) => s.oddsFormat)
  const setOddsFormat = useSettingsStore((s) => s.setOddsFormat)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => {
      window.removeEventListener('mousedown', handler)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-control)] transition-colors"
        title="投注单设置"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-8 z-30 w-64 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl p-3 space-y-3"
        >
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              赔率格式
            </p>
            <div className="space-y-1">
              {FORMAT_OPTIONS.map((opt) => (
                <OptionRow
                  key={opt.id}
                  active={oddsFormat === opt.id}
                  label={opt.label}
                  hint={opt.hint}
                  onClick={() => setOddsFormat(opt.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OptionRow({
  active,
  label,
  hint,
  onClick,
}: {
  active: boolean
  label: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors flex items-start gap-2 ${
        active
          ? 'bg-[#2DD4BF]/10 text-[#2DD4BF]'
          : 'text-[var(--text-primary)] hover:bg-[var(--bg-control)]'
      }`}
    >
      <span
        className={`mt-0.5 w-3 h-3 shrink-0 rounded-full border ${
          active ? 'border-[#2DD4BF] bg-[#2DD4BF]' : 'border-[var(--text-secondary)]'
        }`}
      />
      <span className="min-w-0">
        <span className="block text-xs font-medium">{label}</span>
        <span className="block text-[10px] text-[var(--text-secondary)] mt-0.5">{hint}</span>
      </span>
    </button>
  )
}
