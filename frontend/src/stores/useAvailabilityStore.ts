import { create } from "zustand";
import type { SlotDto } from "@/api/model/models";

function createGrid(rows: number, cols: number): boolean[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(false));
}

interface AvailabilityState {
  grid: boolean[][];
  init: (rows: number, cols: number) => void;
  loadFromSlots: (slots: SlotDto[], dates: string[], timeSlots: string[]) => void;
  select: (r0: number, r1: number, c0: number, c1: number) => void;
  deselect: (r0: number, r1: number, c0: number, c1: number) => void;
  clear: () => void;
}

export const useAvailabilityStore = create<AvailabilityState>((set) => ({
  grid: [],
  init: (rows, cols) => set({ grid: createGrid(rows, cols) }),
  loadFromSlots: (slots, dates, timeSlots) =>
    set((s) => {
      const rows = timeSlots.length;
      const cols = dates.length;
      const grid = s.grid.length === rows && s.grid[0]?.length === cols
        ? s.grid.map((row) => [...row])
        : createGrid(rows, cols);

      // reset all to false first
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) grid[r][c] = false;

      const dateIdx = new Map(dates.map((d, i) => [d, i]));
      const timeIdx = new Map(timeSlots.map((t, i) => [t, i]));

      for (const slot of slots) {
        const c = dateIdx.get(slot.date);
        const r = timeIdx.get(slot.time);
        if (r !== undefined && c !== undefined) {
          grid[r][c] = true;
        }
      }
      return { grid };
    }),
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
