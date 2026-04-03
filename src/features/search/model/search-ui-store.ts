import { create } from "zustand";

export interface SearchUiState {
  draftQuery: string;
  limit: number;
  setDraftQuery: (value: string) => void;
  setLimit: (value: number) => void;
  trimmedQuery: () => string;
}

const initialState = {
  draftQuery: "",
  limit: 20,
};

export const useSearchUiStore = create<SearchUiState>((set, get) => ({
  ...initialState,
  setDraftQuery: (value) => {
    set(() => ({ draftQuery: value }));
  },
  setLimit: (value) => {
    const nextLimit = Number.isFinite(value) && value > 0 ? Math.trunc(value) : initialState.limit;
    set(() => ({ limit: nextLimit }));
  },
  trimmedQuery: () => get().draftQuery.trim(),
}));

export const resetSearchUiStore = () => {
  useSearchUiStore.setState(initialState);
};
