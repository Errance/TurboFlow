import { useState, useEffect } from 'react'

interface Props {
  kickoffDate: Date
}

function getTimeLeft(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now())
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins: Math.floor((diff % 3600000) / 60000),
    secs: Math.floor((diff % 60000) / 1000),
  }
}

export default function KickoffCountdown({ kickoffDate }: Props) {
  const [time, setTime] = useState(() => getTimeLeft(kickoffDate))

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft(kickoffDate)), 1000)
    return () => clearInterval(id)
  }, [kickoffDate])

  const blocks: [string, string][] = [
    [String(time.days), 'Days'],
    [String(time.hours).padStart(2, '0'), 'Hrs'],
    [String(time.mins).padStart(2, '0'), 'Mins'],
    [String(time.secs).padStart(2, '0'), 'Secs'],
  ]

  return (
    <div className="text-center py-3">
      <p className="text-xs text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Kickoff time</p>
      <div className="flex items-center justify-center gap-3">
        {blocks.map(([value, label]) => (
          <div key={label} className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-lg bg-[#0f1923] border border-[var(--border)]/60 flex items-center justify-center">
              <span className="text-2xl font-bold font-mono text-white">{value}</span>
            </div>
            <span className="text-[11px] text-[var(--text-secondary)] mt-1">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
