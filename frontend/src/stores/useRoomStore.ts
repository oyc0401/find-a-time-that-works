import { create } from "zustand";

interface RoomState {
  weekIdx: number;
  nickname: string;
  setWeekIdx: (idx: number) => void;
  setNickname: (name: string) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  weekIdx: 0,
  nickname: "",
  setWeekIdx: (idx) => set({ weekIdx: idx }),
  setNickname: (name) => set({ nickname: name }),
  reset: () => set({ weekIdx: 0, nickname: "" }),
}));
