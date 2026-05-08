import type { ScoreGridMarket as SGData } from '../../data/soccer/types'
import OddsDisplay from './OddsDisplay'
import { makeSelectionKey } from '../../services/oddsRegistry'

interface Props {
  data: SGData
  matchId?: string
  onSelect: (market: string, selection: string, odds: number) => void
  selectedKey?: string
}

type CorrectScoreItem = {
  label: string
  odds: number
}

const correctScoreGroups = [
  { key: 'home', title: '主胜比分' },
  { key: 'draw', title: '平局比分' },
  { key: 'away', title: '客胜比分' },
  { key: 'other', title: '其他比分' },
] as const

function parseScore(label: string): [number, number] | null {
  const match = label.match(/^(\d+):(\d+)$/)
  if (!match) return null
  return [Number(match[1]), Number(match[2])]
}

function scoreSort(a: CorrectScoreItem, b: CorrectScoreItem) {
  const scoreA = parseScore(a.label)
  const scoreB = parseScore(b.label)
  if (!scoreA || !scoreB) return a.label.localeCompare(b.label)
  const totalA = scoreA[0] + scoreA[1]
  const totalB = scoreB[0] + scoreB[1]
  if (totalA !== totalB) return totalA - totalB
  if (scoreA[0] !== scoreB[0]) return scoreB[0] - scoreA[0]
  return scoreA[1] - scoreB[1]
}

function buildCorrectScoreGroups(data: SGData): Record<typeof correctScoreGroups[number]['key'], CorrectScoreItem[]> {
  const groups: Record<typeof correctScoreGroups[number]['key'], CorrectScoreItem[]> = {
    home: [],
    draw: [],
    away: [],
    other: [],
  }

  for (const [label, odds] of Object.entries(data.odds)) {
    const score = parseScore(label)
    if (!score) {
      groups.other.push({ label, odds })
      continue
    }

    const [home, away] = score
    if (home > away) groups.home.push({ label, odds })
    else if (home === away) groups.draw.push({ label, odds })
    else groups.away.push({ label, odds })
  }

  groups.home.sort(scoreSort)
  groups.draw.sort(scoreSort)
  groups.away.sort(scoreSort)

  return groups
}

export default function ScoreGridMarket({ data, matchId, onSelect, selectedKey }: Props) {
  if (data.title.includes('波胆')) {
    const groups = buildCorrectScoreGroups(data)

    return (
      <div className="space-y-3">
        {correctScoreGroups.map((group) => {
          const items = groups[group.key]
          if (items.length === 0) return null

          return (
            <div key={group.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--text-primary)]">{group.title}</span>
                <span className="text-[10px] text-[var(--text-secondary)]">{items.length} 项</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((item) => {
                  const selKey = `${data.title}|${item.label}`
                  const isSelected = selectedKey === selKey
                  const registryKey = matchId ? makeSelectionKey(matchId, data.title, item.label) : undefined
                  return (
                    <button
                      key={item.label}
                      onClick={() => onSelect(data.title, item.label, item.odds)}
                      className={`flex min-h-[48px] flex-col items-center justify-center rounded-lg border px-2 py-2 text-center transition-all ${
                        isSelected
                          ? 'border-[#2DD4BF]/30 bg-[#2DD4BF]/15'
                          : 'border-[var(--border)] bg-[var(--bg-control)] hover:border-[var(--text-secondary)]/30'
                      }`}
                    >
                      <span className={`text-xs font-medium ${isSelected ? 'text-[#2DD4BF]' : 'text-[var(--text-primary)]'}`}>
                        {item.label}
                      </span>
                      <OddsDisplay
                        selectionKey={registryKey}
                        fallbackOdds={item.odds}
                        compactLarge
                        className={`mt-0.5 text-xs font-semibold font-mono tabular-nums ${isSelected ? 'text-[#2DD4BF]' : 'text-red-500'}`}
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="w-10" />
            {data.awayRange.map((a) => (
              <th key={a} className="text-center py-1 px-1 text-[var(--text-secondary)] font-mono font-medium">
                {a}
              </th>
            ))}
          </tr>
          <tr>
            <td />
            <td colSpan={data.awayRange.length} className="text-center text-[10px] text-[var(--text-secondary)] pb-1">
              客队进球
            </td>
          </tr>
        </thead>
        <tbody>
          {data.homeRange.map((h) => (
            <tr key={h}>
              <td className="text-center py-1 px-1 text-[var(--text-secondary)] font-mono font-medium">
                {h}
              </td>
              {data.awayRange.map((a) => {
                const scoreKey = `${h}:${a}`
                const odd = data.odds[scoreKey]
                if (!odd) return <td key={a} className="py-1 px-1"><div className="w-full h-8 rounded bg-[var(--bg-control)]/50" /></td>
                const selKey = `${data.title}|${scoreKey}`
                const isSelected = selectedKey === selKey
                const registryKey = matchId ? makeSelectionKey(matchId, data.title, scoreKey) : undefined
                return (
                  <td key={a} className="py-1 px-1">
                    <button
                      onClick={() => onSelect(data.title, scoreKey, odd)}
                      className={`w-full h-8 rounded-lg font-mono font-medium tabular-nums transition-all text-center ${
                        isSelected
                          ? 'bg-[#2DD4BF]/15 text-[#2DD4BF] border border-[#2DD4BF]/30'
                          : 'bg-[var(--bg-control)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]/30'
                      }`}
                    >
                      <OddsDisplay selectionKey={registryKey} fallbackOdds={odd} compactLarge />
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
          <tr>
            <td className="text-center text-[10px] text-[var(--text-secondary)] pt-1 align-top" style={{ writingMode: 'vertical-rl' }}>
              主队进球
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
