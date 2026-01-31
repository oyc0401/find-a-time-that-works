import { create } from "zustand";

interface DateSelectionState {
  /** 확정된 선택 인덱스 */
  selectedIndices: Set<number>;
  select: (indices: Set<number>) => void;
  deselect: (indices: Set<number>) => void;
  clear: () => void;
}

export const useDateSelectionStore = create<DateSelectionState>((set) => ({
  selectedIndices: new Set(),
  select: (indices) =>
    set((state) => ({
      selectedIndices: new Set([...state.selectedIndices, ...indices]),
    })),
  deselect: (indices) =>
    set((state) => ({
      selectedIndices: new Set(
        [...state.selectedIndices].filter((i) => !indices.has(i)),
      ),
    })),
  clear: () => set({ selectedIndices: new Set() }),
}));
