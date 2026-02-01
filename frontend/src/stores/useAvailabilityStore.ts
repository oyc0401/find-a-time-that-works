import { create } from "zustand";

function createGrid(rows: number, cols: number): boolean[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(false));
}

interface AvailabilityState {
  grid: boolean[][];
  init: (rows: number, cols: number) => void;
  select: (r0: number, r1: number, c0: number, c1: number) => void;
  deselect: (r0: number, r1: number, c0: number, c1: number) => void;
  clear: () => void;
}

export const useAvailabilityStore = create<AvailabilityState>((set) => ({
  grid: [],
  init: (rows, cols) => set({ grid: createGrid(rows, cols) }),
  select: (r0, r1, c0, c1) =>
    set((s) => {
      const next = s.grid.map((row) => [...row]);
      for (let r = r0; r <= r1; r++)
        for (let c = c0; c <= c1; c++) next[r][c] = true;
      return { grid: next };
    }),
  deselect: (r0, r1, c0, c1) =>
    set((s) => {
      const next = s.grid.map((row) => [...row]);
      for (let r = r0; r <= r1; r++)
        for (let c = c0; c <= c1; c++) next[r][c] = false;
      return { grid: next };
    }),
  clear: () =>
    set((s) => ({ grid: s.grid.map((row) => row.map(() => false)) })),
}));
