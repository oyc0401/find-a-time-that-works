import { create } from "zustand";

interface RoomState {
  weekIdx: number;
  nickname: string;
  generatedNickname: string;
  thumbnail: string;
  tabIdx: number;
  selectedUserId?: string;
  setWeekIdx: (idx: number) => void;
  setNickname: (name: string) => void;
  setGeneratedNickname: (name: string) => void;
  setThumbnail: (thumbnail: string) => void;
  setTabIdx: (idx: number) => void;
  setSelectedUserId: (userId?: string) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  weekIdx: 0,
  nickname: "",
  generatedNickname: "",
  thumbnail: "",
  tabIdx: 0,
  selectedUserId: undefined,
  setWeekIdx: (idx) => set({ weekIdx: idx }),
  setNickname: (name) => set({ nickname: name }),
  setGeneratedNickname: (name) => set({ generatedNickname: name }),
  setThumbnail: (thumbnail) => set({ thumbnail }),
  setTabIdx: (idx) => set({ tabIdx: idx }),
  setSelectedUserId: (userId) => set({ selectedUserId: userId }),
  reset: () =>
    set({ weekIdx: 0, nickname: "", generatedNickname: "", thumbnail: "", tabIdx: 0, selectedUserId: undefined }),
}));
