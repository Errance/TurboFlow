import type { SystemType } from '../data/soccer/contracts'

export interface SystemBetLegInput {
  id: string
  oddsCurrent: number
}

export interface SystemBetLine {
  id: string
  legIds: string[]
  odds: number
}

export interface SystemBetProjection {
  type: SystemType
  label: string
  requiredLegs: number
  lineCount: number
  lines: SystemBetLine[]
  totalOdds: number
}

const SYSTEM_META: Record<SystemType, { label: string; requiredLegs: number; sizes: number[] }> = {
  patent: { label: 'Patent', requiredLegs: 3, sizes: [1, 2, 3] },
  trixie: { label: 'Trixie', requiredLegs: 3, sizes: [2, 3] },
  yankee: { label: 'Yankee', requiredLegs: 4, sizes: [2, 3, 4] },
  lucky15: { label: 'Lucky 15', requiredLegs: 4, sizes: [1, 2, 3, 4] },
  heinz: { label: 'Heinz', requiredLegs: 6, sizes: [2, 3, 4, 5, 6] },
}

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]]
  if (items.length < size) return []
  const out: T[][] = []
  items.forEach((item, i) => {
    const rest = items.slice(i + 1)
    for (const combo of combinations(rest, size - 1)) out.push([item, ...combo])
  })
  return out
}

export function getSystemMeta(type: SystemType) {
  return SYSTEM_META[type]
}

export function buildSystemBetProjection(
  type: SystemType,
  legs: SystemBetLegInput[],
): SystemBetProjection {
  const meta = SYSTEM_META[type]
  const activeLegs = legs.slice(0, meta.requiredLegs)
  const lines = meta.sizes.flatMap((size) =>
    combinations(activeLegs, size).map((combo) => ({
      id: `${type}-${size}-${combo.map((l) => l.id).join('-')}`,
      legIds: combo.map((l) => l.id),
      odds: combo.reduce((acc, l) => acc * l.oddsCurrent, 1),
    })),
  )
  const totalOdds = lines.reduce((acc, line) => acc + line.odds, 0)
  return {
    type,
    label: meta.label,
    requiredLegs: meta.requiredLegs,
    lineCount: lines.length,
    lines,
    totalOdds,
  }
}
