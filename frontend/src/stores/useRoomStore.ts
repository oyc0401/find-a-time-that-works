import { create } from "zustand";

interface RoomState {
  weekIdx: number;
  nickname: string;
  generatedNickname: string;
  thumbnail: string;
  tabIdx: number;
  selectedUserId?: string;
  isTutorialOpen: boolean;
  isRoomNameOpen: boolean;
  isNicknameDialogOpen: boolean;
  isThumbnailDialogOpen: boolean;
  isOverviewCalendarOpen: boolean;
  isSelectCalendarOpen: boolean;
  setWeekIdx: (idx: number) => void;
  setNickname: (name: string) => void;
  setGeneratedNickname: (name: string) => void;
  setThumbnail: (thumbnail: string) => void;
  setTabIdx: (idx: number) => void;
  setSelectedUserId: (userId?: string) => void;
  setIsTutorialOpen: (open: boolean) => void;
  setIsRoomNameOpen: (open: boolean) => void;
  setIsNicknameDialogOpen: (open: boolean) => void;
  setIsThumbnailDialogOpen: (open: boolean) => void;
  setIsOverviewCalendarOpen: (open: boolean) => void;
  setIsSelectCalendarOpen: (open: boolean) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  weekIdx: 0,
  nickname: "",
  generatedNickname: "",
  thumbnail: "",
  tabIdx: 0,
  selectedUserId: undefined,
  isTutorialOpen: false,
  isRoomNameOpen: false,
  isNicknameDialogOpen: false,
  isThumbnailDialogOpen: false,
  isOverviewCalendarOpen: false,
  isSelectCalendarOpen: false,
  setWeekIdx: (idx) => set({ weekIdx: idx }),
  setNickname: (name) => set({ nickname: name }),
  setGeneratedNickname: (name) => set({ generatedNickname: name }),
  setThumbnail: (thumbnail) => set({ thumbnail }),
  setTabIdx: (idx) => set({ tabIdx: idx }),
  setSelectedUserId: (userId) => set({ selectedUserId: userId }),
  setIsTutorialOpen: (open) => set({ isTutorialOpen: open }),
  setIsRoomNameOpen: (open) => set({ isRoomNameOpen: open }),
  setIsNicknameDialogOpen: (open) => set({ isNicknameDialogOpen: open }),
  setIsThumbnailDialogOpen: (open) => set({ isThumbnailDialogOpen: open }),
  setIsOverviewCalendarOpen: (open) => set({ isOverviewCalendarOpen: open }),
  setIsSelectCalendarOpen: (open) => set({ isSelectCalendarOpen: open }),
  reset: () =>
    set({
      weekIdx: 0,
      nickname: "",
      generatedNickname: "",
      thumbnail: "",
      tabIdx: 0,
      selectedUserId: undefined,
      isTutorialOpen: false,
      isRoomNameOpen: false,
      isNicknameDialogOpen: false,
      isThumbnailDialogOpen: false,
      isOverviewCalendarOpen: false,
      isSelectCalendarOpen: false,
    }),
}));
