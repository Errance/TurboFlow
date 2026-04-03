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
      <p className="text-[10px] text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Kickoff time</p>
      <div className="flex items-center justify-center gap-2">
        {blocks.map(([value, label]) => (
          <div key={label} className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-lg bg-[#1a2332] border border-[var(--border)] flex items-center justify-center">
              <span className="text-base font-bold font-mono text-[var(--text-primary)]">{value}</span>
            </div>
            <span className="text-[9px] text-[var(--text-secondary)] mt-1">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
