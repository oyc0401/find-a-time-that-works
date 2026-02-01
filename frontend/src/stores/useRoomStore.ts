import { create } from "zustand";

interface RoomState {
  weekIdx: number;
  setWeekIdx: (idx: number) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  weekIdx: 0,
  setWeekIdx: (idx) => set({ weekIdx: idx }),
  reset: () => set({ weekIdx: 0 }),
}));
