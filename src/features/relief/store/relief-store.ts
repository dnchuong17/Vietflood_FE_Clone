import { create } from "zustand";

import type { ReliefQueueFilter } from "../lib/queue";

type ReliefStore = {
  queueFilter: ReliefQueueFilter;
  searchQuery: string;
  setQueueFilter: (queueFilter: ReliefQueueFilter) => void;
  setSearchQuery: (searchQuery: string) => void;
};

const initialState = {
  queueFilter: "all" as ReliefQueueFilter,
  searchQuery: "",
};

export const useReliefStore = create<ReliefStore>()((set) => ({
  ...initialState,
  setQueueFilter: (queueFilter) => set({ queueFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));

export function resetReliefStore() {
  useReliefStore.setState(initialState);
}
