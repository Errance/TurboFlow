import { create } from 'zustand'
import type { CopyButtonState } from '../data/copyTrading'

// Demo-only: 跟单状态与「已跟单」列表，用于广场/详情/我的跟单 状态同步
interface CopyTradingState {
  copyStates: Record<string, CopyButtonState>
  setCopyState: (traderId: string, state: CopyButtonState) => void
  followingIds: string[]
  addFollowing: (id: string) => void
  removeFollowing: (id: string) => void
}

export const useCopyTradingStore = create<CopyTradingState>((set) => ({
  copyStates: {},
  followingIds: [],
  setCopyState: (traderId, state) =>
    set((s) => ({
      copyStates: { ...s.copyStates, [traderId]: state },
    })),
  addFollowing: (id) =>
    set((s) => ({
      followingIds: s.followingIds.includes(id) ? s.followingIds : [...s.followingIds, id],
      copyStates: { ...s.copyStates, [id]: 'Copying' as CopyButtonState },
    })),
  removeFollowing: (id) =>
    set((s) => ({
      followingIds: s.followingIds.filter((x) => x !== id),
      copyStates: { ...s.copyStates, [id]: 'Copy' as CopyButtonState },
    })),
}))
