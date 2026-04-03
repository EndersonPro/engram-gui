import { create } from "zustand";

interface TimelineObservationInput {
  id: number;
  createdAt: string;
}

export interface TimelineUiState {
  selectedObservationId: number | null;
  limit: number;
  setSelectedObservationId: (value: number | null) => void;
  setLimit: (value: number) => void;
}

const initialState = {
  selectedObservationId: null,
  limit: 20,
};

const isValidObservationId = (value: number | null | undefined): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
};

export const pickDeterministicObservationId = (observations: TimelineObservationInput[]): number | null => {
  if (observations.length === 0) {
    return null;
  }

  const sorted = [...observations].sort((left, right) => {
    const byDate = right.createdAt.localeCompare(left.createdAt);
    if (byDate !== 0) {
      return byDate;
    }

    return left.id - right.id;
  });

  return sorted[0]?.id ?? null;
};

export const resolveTimelineObservationSelection = (
  manualSelection: number | null,
  observations: TimelineObservationInput[],
): number | null => {
  if (isValidObservationId(manualSelection)) {
    return manualSelection;
  }

  return pickDeterministicObservationId(observations);
};

export const useTimelineUiStore = create<TimelineUiState>((set) => ({
  ...initialState,
  setSelectedObservationId: (value) => {
    set(() => ({ selectedObservationId: isValidObservationId(value) ? value : null }));
  },
  setLimit: (value) => {
    const nextLimit = Number.isFinite(value) && value > 0 ? Math.trunc(value) : initialState.limit;
    set(() => ({ limit: nextLimit }));
  },
}));

export const resetTimelineUiStore = () => {
  useTimelineUiStore.setState(initialState);
};
