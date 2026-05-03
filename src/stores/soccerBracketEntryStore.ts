import { create } from 'zustand'
import type { UserBracketEntry } from '../data/soccer/bracketData'
import { DEFAULT_ATTRIBUTION, sampleEntries } from '../data/soccer/bracketData'

type EntryPatch = {
  tournamentId: string
  userName?: string
  picks: Record<string, string>
  tiebreakerGuess?: number
}

interface SoccerBracketEntryState {
  entries: Record<string, UserBracketEntry>
  shareSnapshots: Record<string, UserBracketEntry>
  getEntry: (tournamentId: string) => UserBracketEntry | undefined
  updateDraft: (patch: EntryPatch) => UserBracketEntry
  submitEntry: (patch: EntryPatch) => UserBracketEntry
  saveEntry: (patch: EntryPatch) => UserBracketEntry
  withdrawEntry: (tournamentId: string) => UserBracketEntry | undefined
  createShareSnapshot: (tournamentId: string, fallbackEntry?: UserBracketEntry) => UserBracketEntry | undefined
  getShareSnapshot: (shareId: string) => UserBracketEntry | undefined
}

const initialShareSnapshots = sampleEntries.reduce<Record<string, UserBracketEntry>>((acc, entry) => {
  if (entry.shareId) acc[entry.shareId] = entry
  return acc
}, {})

function makeEntryId(tournamentId: string): string {
  return `entry-${tournamentId}-self`
}

function makeShareId(tournamentId: string): string {
  return `share-${tournamentId}-${Date.now()}`
}

function cloneEntry(entry: UserBracketEntry): UserBracketEntry {
  return JSON.parse(JSON.stringify(entry)) as UserBracketEntry
}

export const useSoccerBracketEntryStore = create<SoccerBracketEntryState>((set, get) => ({
  entries: {},
  shareSnapshots: initialShareSnapshots,

  getEntry: (tournamentId) => get().entries[tournamentId],

  updateDraft: (patch) => {
    const existing = get().entries[patch.tournamentId]
    const next: UserBracketEntry = {
      id: existing?.id ?? makeEntryId(patch.tournamentId),
      tournamentId: patch.tournamentId,
      userName: patch.userName ?? existing?.userName ?? '我',
      picks: patch.picks,
      tiebreakerGuess: patch.tiebreakerGuess,
      status: existing?.status === 'submitted' ? 'submitted' : 'draft',
      submittedAt: existing?.submittedAt,
      shareId: existing?.shareId,
      attribution: existing?.attribution ?? DEFAULT_ATTRIBUTION,
    }
    set((state) => ({
      entries: { ...state.entries, [patch.tournamentId]: next },
    }))
    return next
  },

  submitEntry: (patch) => {
    const existing = get().entries[patch.tournamentId]
    const now = new Date().toISOString()
    const next: UserBracketEntry = {
      id: existing?.id ?? makeEntryId(patch.tournamentId),
      tournamentId: patch.tournamentId,
      userName: patch.userName ?? existing?.userName ?? '我',
      picks: patch.picks,
      tiebreakerGuess: patch.tiebreakerGuess,
      status: 'submitted',
      submittedAt: existing?.submittedAt ?? now,
      shareId: existing?.shareId,
      attribution: existing?.attribution ?? DEFAULT_ATTRIBUTION,
    }
    set((state) => ({
      entries: { ...state.entries, [patch.tournamentId]: next },
    }))
    return next
  },

  saveEntry: (patch) => {
    const existing = get().entries[patch.tournamentId]
    if (!existing || existing.status !== 'submitted') return get().submitEntry(patch)
    const next: UserBracketEntry = {
      ...existing,
      picks: patch.picks,
      tiebreakerGuess: patch.tiebreakerGuess,
    }
    set((state) => ({
      entries: { ...state.entries, [patch.tournamentId]: next },
    }))
    return next
  },

  withdrawEntry: (tournamentId) => {
    const existing = get().entries[tournamentId]
    if (!existing || existing.status !== 'submitted') return existing
    const next: UserBracketEntry = {
      ...existing,
      status: 'refunded',
      refundedAt: new Date().toISOString(),
      refundReason: 'user_withdraw',
    }
    set((state) => ({
      entries: { ...state.entries, [tournamentId]: next },
    }))
    return next
  },

  createShareSnapshot: (tournamentId, fallbackEntry) => {
    const existing = get().entries[tournamentId] ?? fallbackEntry
    if (!existing || existing.status === 'draft') return undefined
    const shareId = existing.shareId ?? makeShareId(tournamentId)
    const snapshot = cloneEntry({ ...existing, shareId })
    set((state) => ({
      entries: {
        ...state.entries,
        [tournamentId]: { ...existing, shareId },
      },
      shareSnapshots: {
        ...state.shareSnapshots,
        [shareId]: snapshot,
      },
    }))
    return snapshot
  },

  getShareSnapshot: (shareId) => get().shareSnapshots[shareId],
}))
