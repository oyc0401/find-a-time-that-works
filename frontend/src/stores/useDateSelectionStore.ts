import { create } from "zustand";

const H = 5;
const W = 7;

function createEmpty(): boolean[][] {
  return Array.from({ length: H }, () => Array(W).fill(false));
}

export interface Rect {
  r0: number;
  r1: number;
  c0: number;
  c1: number;
}

interface DateSelectionState {
  confirmed: boolean[][];
  select: (rect: Rect) => void;
  deselect: (rect: Rect) => void;
  clear: () => void;
}

export const useDateSelectionStore = create<DateSelectionState>((set) => ({
  confirmed: createEmpty(),
  select: (rect) =>
    set((state) => {
      const next = state.confirmed.map((row) => [...row]);
      for (let r = rect.r0; r <= rect.r1; r++) {
        for (let c = rect.c0; c <= rect.c1; c++) {
          next[r][c] = true;
        }
      }
      return { confirmed: next };
    }),
  deselect: (rect) =>
    set((state) => {
      const next = state.confirmed.map((row) => [...row]);
      for (let r = rect.r0; r <= rect.r1; r++) {
        for (let c = rect.c0; c <= rect.c1; c++) {
          next[r][c] = false;
        }
      }
      return { confirmed: next };
    }),
  clear: () => set({ confirmed: createEmpty() }),
}));
